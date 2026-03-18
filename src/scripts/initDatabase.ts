// src/scripts/initDatabase.ts
import mongoose from 'mongoose';

import { env } from '@/config/env.ts';
import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';
import { RoleModel } from '@/models/role/role.ts';
import { RoleDeptModel } from '@/models/roleDept/roleDept.ts';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { UserModel } from '@/models/users/users.ts';
import { bcryptUtil } from '@/utils/bcrypt.ts';

import 'dotenv/config'; // 加载环境变量

/**
 * 初始化数据库
 * 1. 连接数据库
 * 2. 创建基础数据（部门、角色、菜单、用户）
 * 3. 建立关联关系
 */
async function initDatabase() {
  try {
    console.log('开始初始化数据库...');

    // 连接数据库
    await mongoose.connect(env.MONGODB.URI);
    console.log('✅ 数据库连接成功');

    // 清空现有数据（可选，生产环境不要使用）
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 清空现有数据...');
      await Promise.all([
        UserModel.deleteMany({}),
        RoleModel.deleteMany({}),
        DeptModel.deleteMany({}),
        MenuModel.deleteMany({}),
        UserRoleModel.deleteMany({}),
        RoleMenuModel.deleteMany({}),
        RoleDeptModel.deleteMany({}),
      ]);
      console.log('✅ 数据清空完成');
    }

    // 1. 创建基础部门（如果不存在）
    console.log('🔄 创建基础部门...');

    // 检查部门是否已存在
    let rootDept = await DeptModel.findOne({ code: 'root' });
    if (!rootDept) {
      rootDept = await DeptModel.create({
        name: '总公司',
        code: 'root',
        parentId: null,
        ancestors: ',',
        orderNum: 0,
        status: '0',
      });
      console.log('✅ 创建总公司部门');
    } else {
      console.log('✅ 总公司部门已存在');
    }

    let devDept = await DeptModel.findOne({ code: 'dev' });
    if (!devDept) {
      devDept = await DeptModel.create({
        name: '技术部',
        code: 'dev',
        parentId: rootDept._id,
        ancestors: `,${rootDept._id},`,
        orderNum: 10,
        leader: '技术总监',
        status: '0',
      });
      console.log('✅ 创建技术部部门');
    } else {
      console.log('✅ 技术部部门已存在');
    }

    let salesDept = await DeptModel.findOne({ code: 'sales' });
    if (!salesDept) {
      salesDept = await DeptModel.create({
        name: '销售部',
        code: 'sales',
        parentId: rootDept._id,
        ancestors: `,${rootDept._id},`,
        orderNum: 20,
        leader: '销售经理',
        status: '0',
      });
      console.log('✅ 创建销售部部门');
    } else {
      console.log('✅ 销售部部门已存在');
    }

    console.log('✅ 部门创建完成');

    // 2. 创建基础角色（如果不存在）
    console.log('🔄 创建基础角色...');

    let adminRole = await RoleModel.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await RoleModel.create({
        name: 'admin',
        label: '超级管理员',
        dataScope: '1', // 全部数据权限
        status: '0',
        remark: '系统超级管理员，拥有所有权限',
      });
      console.log('✅ 创建超级管理员角色');
    } else {
      console.log('✅ 超级管理员角色已存在');
    }

    let managerRole = await RoleModel.findOne({ name: 'manager' });
    if (!managerRole) {
      managerRole = await RoleModel.create({
        name: 'manager',
        label: '部门经理',
        dataScope: '3', // 本部门数据权限
        status: '0',
        remark: '部门经理，管理本部门事务',
      });
      console.log('✅ 创建部门经理角色');
    } else {
      console.log('✅ 部门经理角色已存在');
    }

    let userRole = await RoleModel.findOne({ name: 'user' });
    if (!userRole) {
      userRole = await RoleModel.create({
        name: 'user',
        label: '普通用户',
        dataScope: '5', // 仅本人数据权限
        status: '0',
        remark: '普通用户，只有基本权限',
      });
      console.log('✅ 创建普通用户角色');
    } else {
      console.log('✅ 普通用户角色已存在');
    }

    console.log('✅ 角色创建完成');

    // 3. 创建基础菜单（如果不存在）
    console.log('🔄 创建基础菜单...');

    // 首页菜单
    let homeMenu = await MenuModel.findOne({ name: 'home' });
    if (!homeMenu) {
      homeMenu = await MenuModel.create({
        name: 'home',
        path: '/home',
        component: 'home/index',
        title: '首页',
        icon: 'home',
        sort: 0,
        type: 'menu',
        hidden: false,
        cache: true,
      });
      console.log('✅ 创建首页菜单');
    } else {
      console.log('✅ 首页菜单已存在');
    }

    // 系统管理菜单（父级）
    let systemMenu = await MenuModel.findOne({ name: 'system' });
    if (!systemMenu) {
      systemMenu = await MenuModel.create({
        name: 'system',
        path: '/system',
        component: 'Layout',
        title: '系统管理',
        icon: 'system',
        sort: 1,
        type: 'menu',
        hidden: false,
        cache: true,
      });
      console.log('✅ 创建系统管理菜单');
    } else {
      console.log('✅ 系统管理菜单已存在');
    }

    // 用户管理
    let userMenu = await MenuModel.findOne({ name: 'user' });
    if (!userMenu) {
      userMenu = await MenuModel.create({
        pid: systemMenu._id,
        name: 'user',
        path: '/system/user',
        component: 'system/user/index',
        title: '用户管理',
        icon: 'user',
        sort: 10,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:user:list',
      });
      console.log('✅ 创建用户管理菜单');
    } else {
      console.log('✅ 用户管理菜单已存在');
    }

    // 角色管理
    let roleMenu = await MenuModel.findOne({ name: 'role' });
    if (!roleMenu) {
      roleMenu = await MenuModel.create({
        pid: systemMenu._id,
        name: 'role',
        path: '/system/role',
        component: 'system/role/index',
        title: '角色管理',
        icon: 'peoples',
        sort: 20,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:role:list',
      });
      console.log('✅ 创建角色管理菜单');
    } else {
      console.log('✅ 角色管理菜单已存在');
    }

    // 菜单管理
    let menuMenu = await MenuModel.findOne({ name: 'menu' });
    if (!menuMenu) {
      menuMenu = await MenuModel.create({
        pid: systemMenu._id,
        name: 'menu',
        path: '/system/menu',
        component: 'system/menu/index',
        title: '菜单管理',
        icon: 'tree-table',
        sort: 30,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:menu:list',
      });
      console.log('✅ 创建菜单管理菜单');
    } else {
      console.log('✅ 菜单管理菜单已存在');
    }

    // 部门管理
    let deptMenu = await MenuModel.findOne({ name: 'dept' });
    if (!deptMenu) {
      deptMenu = await MenuModel.create({
        pid: systemMenu._id,
        name: 'dept',
        path: '/system/dept',
        component: 'system/dept/index',
        title: '部门管理',
        icon: 'tree',
        sort: 40,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:dept:list',
      });
      console.log('✅ 创建部门管理菜单');
    } else {
      console.log('✅ 部门管理菜单已存在');
    }

    // 系统设置
    let settingMenu = await MenuModel.findOne({ name: 'setting' });
    if (!settingMenu) {
      settingMenu = await MenuModel.create({
        pid: systemMenu._id,
        name: 'setting',
        path: '/system/setting',
        component: 'system/setting/index',
        title: '系统设置',
        icon: 'setting',
        sort: 50,
        type: 'menu',
        hidden: false,
        cache: true,
      });
      console.log('✅ 创建系统设置菜单');
    } else {
      console.log('✅ 系统设置菜单已存在');
    }

    console.log('✅ 菜单创建完成');

    // 4. 分配菜单权限（避免重复）
    console.log('🔄 分配菜单权限...');

    const allMenus = [homeMenu, systemMenu, userMenu, roleMenu, menuMenu, deptMenu, settingMenu];

    // 为超级管理员分配所有菜单权限
    for (const menu of allMenus) {
      const existing = await RoleMenuModel.findOne({ roleId: adminRole._id, menuId: menu._id });
      if (!existing) {
        await RoleMenuModel.create({
          roleId: adminRole._id,
          menuId: menu._id,
        });
      }
    }
    console.log('✅ 超级管理员菜单权限分配完成');

    // 为部门经理分配部分菜单权限
    const managerMenus = [homeMenu, userMenu];
    for (const menu of managerMenus) {
      const existing = await RoleMenuModel.findOne({ roleId: managerRole._id, menuId: menu._id });
      if (!existing) {
        await RoleMenuModel.create({
          roleId: managerRole._id,
          menuId: menu._id,
        });
      }
    }
    console.log('✅ 部门经理菜单权限分配完成');

    // 为普通用户分配首页权限
    const userMenuExisting = await RoleMenuModel.findOne({ roleId: userRole._id, menuId: homeMenu._id });
    if (!userMenuExisting) {
      await RoleMenuModel.create({
        roleId: userRole._id,
        menuId: homeMenu._id,
      });
      console.log('✅ 普通用户菜单权限分配完成');
    } else {
      console.log('✅ 普通用户菜单权限已存在');
    }

    console.log('✅ 菜单权限分配完成');

    // 5. 创建用户（如果不存在）
    console.log('🔄 创建用户...');

    // 超级管理员
    let adminUser = await UserModel.findOne({ account: 'admin' });
    if (!adminUser) {
      const adminPassword = 'Admin_123';
      adminUser = await UserModel.create({
        account: 'admin',
        password: adminPassword,
        username: '超级管理员',
        deptId: rootDept._id,
        phone: '13800138000',
        email: 'admin@example.com',
      });
      console.log('✅ 创建超级管理员用户');
    } else {
      console.log('✅ 超级管理员用户已存在');
    }

    // 部门经理
    let managerUser = await UserModel.findOne({ account: 'manager' });
    if (!managerUser) {
      const managerPassword = 'Manager_123';
      managerUser = await UserModel.create({
        account: 'manager',
        password: managerPassword,
        username: '技术经理',
        deptId: devDept._id,
        phone: '13800138001',
        email: 'manager@example.com',
      });
      console.log('✅ 创建部门经理用户');
    } else {
      console.log('✅ 部门经理用户已存在');
    }

    // 普通用户
    let normalUser = await UserModel.findOne({ account: 'user' });
    if (!normalUser) {
      const userPassword = 'User_123';
      normalUser = await UserModel.create({
        account: 'user',
        password: userPassword,
        username: '普通用户',
        deptId: devDept._id,
        phone: '13800138002',
        email: 'user@example.com',
      });
      console.log('✅ 创建普通用户');
    } else {
      console.log('✅ 普通用户已存在');
    }

    console.log('✅ 用户创建完成');

    // 6. 为用户分配角色（如果不存在）
    console.log('🔄 为用户分配角色...');

    // 检查并分配超级管理员角色
    let adminUserRole = await UserRoleModel.findOne({ userId: adminUser._id, roleId: adminRole._id });
    if (!adminUserRole) {
      await UserRoleModel.create({
        userId: adminUser._id,
        roleId: adminRole._id,
      });
      console.log('✅ 为超级管理员分配角色');
    } else {
      console.log('✅ 超级管理员角色已分配');
    }

    // 检查并分配部门经理角色
    let managerUserRole = await UserRoleModel.findOne({ userId: managerUser._id, roleId: managerRole._id });
    if (!managerUserRole) {
      await UserRoleModel.create({
        userId: managerUser._id,
        roleId: managerRole._id,
      });
      console.log('✅ 为部门经理分配角色');
    } else {
      console.log('✅ 部门经理角色已分配');
    }

    // 检查并分配普通用户角色
    let userUserRole = await UserRoleModel.findOne({ userId: normalUser._id, roleId: userRole._id });
    if (!userUserRole) {
      await UserRoleModel.create({
        userId: normalUser._id,
        roleId: userRole._id,
      });
      console.log('✅ 为普通用户分配角色');
    } else {
      console.log('✅ 普通用户角色已分配');
    }

    console.log('✅ 角色分配完成');

    // 7. 为部门经理角色分配部门权限（数据权限）
    console.log('🔄 设置数据权限...');
    const existingRoleDept = await RoleDeptModel.findOne({ roleId: managerRole._id, deptId: devDept._id });
    if (!existingRoleDept) {
      await RoleDeptModel.create({
        roleId: managerRole._id,
        deptId: devDept._id,
      });
      console.log('✅ 数据权限设置完成');
    } else {
      console.log('✅ 数据权限已存在');
    }

    // 输出初始化结果
    console.log('\n🎉 数据库初始化完成！');
    console.log('================================');
    console.log('测试账号信息：');
    console.log('--------------------------------');
    console.log('超级管理员：');
    console.log('  账号: admin');
    console.log('  密码: Admin_123');
    console.log('  部门: 总公司');
    console.log('  角色: 超级管理员');
    console.log('--------------------------------');
    console.log('部门经理：');
    console.log('  账号: manager');
    console.log('  密码: Manager_123');
    console.log('  部门: 技术部');
    console.log('  角色: 部门经理');
    console.log('--------------------------------');
    console.log('普通用户：');
    console.log('  账号: user');
    console.log('  密码: User_123');
    console.log('  部门: 技术部');
    console.log('  角色: 普通用户');
    console.log('================================');
    console.log('\n⚠️  请及时修改默认密码！');

    // 断开数据库连接
    await mongoose.disconnect();
    console.log('✅ 数据库连接已断开');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 直接运行初始化
initDatabase();

export { initDatabase };
