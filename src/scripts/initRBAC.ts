// src/scripts/initRBAC.ts
import mongoose from 'mongoose';

import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';
import { RoleModel } from '@/models/role/role.ts';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { UserModel } from '@/models/users/users.ts';
import { bcryptUtil } from '@/utils/bcrypt.ts';
// import { config } from '@/config/index.ts';

/**
 * 初始化RBAC系统
 * 1. 创建超级管理员角色
 * 2. 创建基础部门
 * 3. 创建基础菜单
 * 4. 创建超级管理员用户
 * 5. 分配权限
 */
async function initRBAC() {
  try {
    console.log('开始初始化RBAC系统...');

    // 连接数据库
    await mongoose.connect('mongodb://127.0.0.1:27017/my_admin');
    console.log('数据库连接成功');

    // 1. 创建基础部门
    console.log('创建基础部门...');
    const rootDept = await DeptModel.findOneAndUpdate(
      { code: 'root' },
      {
        name: '总公司',
        code: 'root',
        parentId: null,
        ancestors: ',',
        orderNum: 0,
        status: '0',
      },
      { upsert: true, new: true }
    );
    console.log('基础部门创建完成:', rootDept.name);

    // 2. 创建超级管理员角色
    console.log('创建超级管理员角色...');
    const adminRole = await RoleModel.findOneAndUpdate(
      { name: 'admin' },
      {
        name: 'admin',
        label: '超级管理员',
        dataScope: '1', // 全部数据权限
        status: '0',
        remark: '系统超级管理员，拥有所有权限',
      },
      { upsert: true, new: true }
    );
    console.log('超级管理员角色创建完成:', adminRole.name);

    // 3. 创建基础菜单
    console.log('创建基础菜单...');
    const menus = [
      // 系统管理菜单
      {
        name: 'system',
        path: '/system',
        component: 'Layout',
        title: '系统管理',
        icon: 'system',
        sort: 1,
        type: 'menu' as const,
        hidden: false,
      },
      {
        name: 'user',
        path: '/system/user',
        component: 'system/user/index',
        title: '用户管理',
        icon: 'user',
        sort: 10,
        type: 'menu' as const,
        hidden: false,
        permission: 'system:user:list',
      },
      {
        name: 'role',
        path: '/system/role',
        component: 'system/role/index',
        title: '角色管理',
        icon: 'peoples',
        sort: 20,
        type: 'menu' as const,
        hidden: false,
        permission: 'system:role:list',
      },
      {
        name: 'menu',
        path: '/system/menu',
        component: 'system/menu/index',
        title: '菜单管理',
        icon: 'tree-table',
        sort: 30,
        type: 'menu' as const,
        hidden: false,
        permission: 'system:menu:list',
      },
      {
        name: 'dept',
        path: '/system/dept',
        component: 'system/dept/index',
        title: '部门管理',
        icon: 'tree',
        sort: 40,
        type: 'menu' as const,
        hidden: false,
        permission: 'system:dept:list',
      },
    ];

    const createdMenus = [];
    for (const menuData of menus) {
      let pid = null;
      if (menuData.name !== 'system') {
        const parentMenu = await MenuModel.findOne({ name: 'system' });
        if (parentMenu) {
          pid = parentMenu._id;
        }
      }

      const menu = await MenuModel.findOneAndUpdate(
        { name: menuData.name },
        {
          ...menuData,
          pid,
        },
        { upsert: true, new: true }
      );
      createdMenus.push(menu);
    }
    console.log('基础菜单创建完成，共创建', createdMenus.length, '个菜单');

    // 4. 为超级管理员角色分配所有菜单权限
    console.log('为超级管理员分配菜单权限...');
    await RoleMenuModel.deleteMany({ roleId: adminRole._id });

    const roleMenuDocs = createdMenus.map((menu) => ({
      roleId: adminRole._id,
      menuId: menu._id,
    }));

    await RoleMenuModel.insertMany(roleMenuDocs);
    console.log('菜单权限分配完成');

    // 5. 创建超级管理员用户
    console.log('创建超级管理员用户...');
    const hashedPassword = await bcryptUtil.hash('admin123_');

    const adminUser = await UserModel.findOneAndUpdate(
      { account: 'admin' },
      {
        account: 'admin',
        password: hashedPassword,
        username: '超级管理员',
        deptId: rootDept._id,
        phone: '13800138000',
        email: 'admin@example.com',
      },
      { upsert: true, new: true }
    );
    console.log('超级管理员用户创建完成:', adminUser.account);

    // 6. 为超级管理员用户分配角色
    console.log('为超级管理员分配角色...');
    await UserRoleModel.findOneAndUpdate(
      { userId: adminUser._id, roleId: adminRole._id },
      {
        userId: adminUser._id,
        roleId: adminRole._id,
      },
      { upsert: true }
    );
    console.log('角色分配完成');

    // 7. 创建普通用户角色
    console.log('创建普通用户角色...');
    const userRole = await RoleModel.findOneAndUpdate(
      { name: 'user' },
      {
        name: 'user',
        label: '普通用户',
        dataScope: '5', // 仅本人数据权限
        status: '0',
        remark: '普通用户，只有基本权限',
      },
      { upsert: true, new: true }
    );
    console.log('普通用户角色创建完成:', userRole.name);

    // 8. 为普通用户角色分配基础菜单权限（只有首页）
    const homeMenu = await MenuModel.findOne({ name: 'home' });
    if (!homeMenu) {
      // 创建首页菜单
      const homeMenuData = {
        name: 'home',
        path: '/home',
        component: 'home/index',
        title: '首页',
        icon: 'home',
        sort: 0,
        type: 'menu' as const,
        hidden: false,
      };

      const createdHomeMenu = await MenuModel.findOneAndUpdate({ name: 'home' }, homeMenuData, { upsert: true, new: true });

      await RoleMenuModel.findOneAndUpdate(
        { roleId: userRole._id, menuId: createdHomeMenu._id },
        {
          roleId: userRole._id,
          menuId: createdHomeMenu._id,
        },
        { upsert: true }
      );
      console.log('首页菜单创建并分配给普通用户');
    }

    console.log('RBAC系统初始化完成！');
    console.log('================================');
    console.log('超级管理员账号: admin');
    console.log('初始密码: admin123');
    console.log('请及时修改密码！');
    console.log('================================');

    // 断开数据库连接
    await mongoose.disconnect();
    console.log('数据库连接已断开');
  } catch (error) {
    console.error('RBAC系统初始化失败:', error);
    process.exit(1);
  }
}

// // 如果是直接运行此脚本
// if (require.main === module) {
//   initRBAC();
// }

export { initRBAC };
