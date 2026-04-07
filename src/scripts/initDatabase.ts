// src/scripts/initDatabase.enhanced.ts
/**
 * 增强版数据库初始化脚本
 * 包含更完整的菜单结构和权限设置
 */

import mongoose from 'mongoose';

import { computedEnv as env } from '@/config/env.ts';
import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';
import { RoleModel } from '@/models/role/role.ts';
import { RoleDeptModel } from '@/models/roleDept/roleDept.ts';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { UserModel } from '@/models/users/users.ts';

import 'dotenv/config';

/**
 * 初始化数据库
 */
async function initEnhancedDatabase() {
  try {
    console.log('🚀 开始增强版数据库初始化...');
    console.log('='.repeat(60));

    // 连接数据库
    await mongoose.connect(env.MONGODB.URI);
    console.log('✅ 数据库连接成功');

    // 清空现有数据（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 清空现有数据...');
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

    // ==================== 1. 创建部门 ====================
    console.log('\n📁 1. 创建部门结构...');

    const departments = [
      { name: '总公司', code: 'root', parentId: null, orderNum: 0, leader: 'CEO' },
      { name: '技术部', code: 'dev', parentId: null, orderNum: 10, leader: 'CTO' },
      { name: '产品部', code: 'product', parentId: null, orderNum: 20, leader: '产品总监' },
      { name: '市场部', code: 'market', parentId: null, orderNum: 30, leader: '市场总监' },
      { name: '销售部', code: 'sales', parentId: null, orderNum: 40, leader: '销售总监' },
      { name: '人力资源部', code: 'hr', parentId: null, orderNum: 50, leader: 'HR总监' },
      { name: '财务部', code: 'finance', parentId: null, orderNum: 60, leader: '财务总监' },
    ];

    const deptMap = new Map<string, mongoose.Types.ObjectId>();

    for (const dept of departments) {
      const existing = await DeptModel.findOne({ code: dept.code });
      if (!existing) {
        const parentDeptId = dept.parentId && deptMap.get(dept.parentId);
        const newDept = await DeptModel.create({
          name: dept.name,
          code: dept.code,
          parentId: parentDeptId || null,
          ancestors: parentDeptId ? `,${parentDeptId},` : ',',
          orderNum: dept.orderNum,
          leader: dept.leader,
          status: '0',
        });
        deptMap.set(dept.code, newDept._id);
        console.log(`   ✅ 创建部门: ${dept.name}`);
      } else {
        deptMap.set(dept.code, existing._id);
        console.log(`   ℹ️  部门已存在: ${dept.name}`);
      }
    }

    console.log('✅ 部门创建完成');

    // ==================== 2. 创建角色 ====================
    console.log('\n👥 2. 创建角色...');

    const roles = [
      { name: 'super_admin', label: '超级管理员', dataScope: '1', status: '0', remark: '系统最高权限管理员' },
      { name: 'admin', label: '管理员', dataScope: '2', status: '0', remark: '系统管理员' },
      { name: 'dept_manager', label: '部门主管', dataScope: '3', status: '0', remark: '部门主管，管理本部门' },
      { name: 'project_manager', label: '项目经理', dataScope: '4', status: '0', remark: '项目管理权限' },
      { name: 'developer', label: '开发人员', dataScope: '5', status: '0', remark: '开发人员权限' },
      { name: 'tester', label: '测试人员', dataScope: '5', status: '0', remark: '测试人员权限' },
      { name: 'user', label: '普通用户', dataScope: '5', status: '0', remark: '普通用户权限' },
      { name: 'guest', label: '访客', dataScope: '5', status: '1', remark: '访客权限（停用）' },
    ];

    const roleMap = new Map<string, mongoose.Types.ObjectId>();

    for (const role of roles) {
      const existing = await RoleModel.findOne({ name: role.name });
      if (!existing) {
        const newRole = await RoleModel.create(role);
        roleMap.set(role.name, newRole._id);
        console.log(`   ✅ 创建角色: ${role.label}`);
      } else {
        roleMap.set(role.name, existing._id);
        console.log(`   ℹ️  角色已存在: ${role.label}`);
      }
    }

    console.log('✅ 角色创建完成');

    // ==================== 3. 创建菜单 ====================
    console.log('\n📋 3. 创建菜单结构...');

    const menuMap = new Map<string, mongoose.Types.ObjectId>();

    // 创建顶级菜单
    const topLevelMenus = [
      { name: 'home', path: '/home', component: 'home/index', title: '首页', icon: 'home', sort: 0, type: 'menu', hidden: false, cache: true, permission: 'home:view', status: '0' },
      { name: 'system', path: '/system', component: 'Layout', title: '系统管理', icon: 'system', sort: 1, type: 'menu', hidden: false, cache: true, permission: 'system:manage', status: '0' },
      { name: 'business', path: '/business', component: 'Layout', title: '业务管理', icon: 'business', sort: 2, type: 'menu', hidden: false, cache: true, permission: 'business:manage', status: '0' },
    ];

    for (const menu of topLevelMenus) {
      const existing = await MenuModel.findOne({ name: menu.name });
      if (!existing) {
        const newMenu = await MenuModel.create(menu);
        menuMap.set(menu.name, newMenu._id);
        console.log(`   ✅ 创建菜单: ${menu.title}`);
      } else {
        menuMap.set(menu.name, existing._id);
        console.log(`   ℹ️  菜单已存在: ${menu.title}`);
      }
    }

    // 创建系统管理子菜单
    const systemMenus = [
      {
        name: 'user',
        path: '/system/user',
        component: 'system/user/index',
        title: '用户管理',
        icon: 'user',
        sort: 10,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:user:list,system:user:add,system:user:edit,system:user:delete,system:user:export',
        status: '0',
      },
      {
        name: 'role',
        path: '/system/role',
        component: 'system/role/index',
        title: '角色管理',
        icon: 'peoples',
        sort: 20,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:role:list,system:role:add,system:role:edit,system:role:delete,system:role:export',
        status: '0',
      },
      {
        name: 'menu',
        path: '/system/menu',
        component: 'system/menu/index',
        title: '菜单管理',
        icon: 'tree-table',
        sort: 30,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:menu:list,system:menu:add,system:menu:edit,system:menu:delete',
        status: '0',
      },
      {
        name: 'dept',
        path: '/system/dept',
        component: 'system/dept/index',
        title: '部门管理',
        icon: 'tree',
        sort: 40,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'system:dept:list,system:dept:add,system:dept:edit,system:dept:delete,system:dept:export',
        status: '0',
      },
    ];

    const systemMenuId = menuMap.get('system');
    if (systemMenuId) {
      for (const menu of systemMenus) {
        const existing = await MenuModel.findOne({ name: menu.name });
        if (!existing) {
          const newMenu = await MenuModel.create({ ...menu, pid: systemMenuId });
          menuMap.set(menu.name, newMenu._id);
          console.log(`   ✅ 创建子菜单: ${menu.title}`);
        } else {
          menuMap.set(menu.name, existing._id);
          console.log(`   ℹ️  子菜单已存在: ${menu.title}`);
        }
      }
    }

    // 创建业务管理子菜单
    const businessMenus = [
      {
        name: 'project',
        path: '/business/project',
        component: 'business/project/index',
        title: '项目管理',
        icon: 'project',
        sort: 10,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'business:project:list',
        status: '0',
      },
      {
        name: 'task',
        path: '/business/task',
        component: 'business/task/index',
        title: '任务管理',
        icon: 'task',
        sort: 20,
        type: 'menu',
        hidden: false,
        cache: true,
        permission: 'business:task:list',
        status: '0',
      },
    ];

    const businessMenuId = menuMap.get('business');
    if (businessMenuId) {
      for (const menu of businessMenus) {
        const existing = await MenuModel.findOne({ name: menu.name });
        if (!existing) {
          const newMenu = await MenuModel.create({ ...menu, pid: businessMenuId });
          menuMap.set(menu.name, newMenu._id);
          console.log(`   ✅ 创建子菜单: ${menu.title}`);
        } else {
          menuMap.set(menu.name, existing._id);
          console.log(`   ℹ️  子菜单已存在: ${menu.title}`);
        }
      }
    }

    console.log('✅ 菜单创建完成');

    // ==================== 4. 分配菜单权限 ====================
    console.log('\n🔐 4. 分配菜单权限...');

    // 获取所有菜单ID
    const allMenuIds = Array.from(menuMap.values());

    // 超级管理员：所有菜单
    await assignMenusToRole(roleMap.get('super_admin')!, allMenuIds, '超级管理员');

    // 管理员：系统管理 + 业务管理
    const adminMenuIds = [
      ...(systemMenus.map((m) => menuMap.get(m.name)).filter(Boolean) as mongoose.Types.ObjectId[]),
      ...(businessMenus.map((m) => menuMap.get(m.name)).filter(Boolean) as mongoose.Types.ObjectId[]),
      menuMap.get('home')!,
    ];
    await assignMenusToRole(roleMap.get('admin')!, adminMenuIds, '管理员');

    // 部门主管：业务管理 + 部分系统管理
    const managerMenuIds = [menuMap.get('home')!, menuMap.get('user')!, menuMap.get('project')!, menuMap.get('task')!].filter(Boolean) as mongoose.Types.ObjectId[];
    await assignMenusToRole(roleMap.get('dept_manager')!, managerMenuIds, '部门主管');

    // 开发人员：业务管理相关
    const devMenuIds = [menuMap.get('home')!, menuMap.get('project')!, menuMap.get('task')!].filter(Boolean) as mongoose.Types.ObjectId[];
    await assignMenusToRole(roleMap.get('developer')!, devMenuIds, '开发人员');

    // 普通用户：仅仪表盘
    const userMenuIds = [menuMap.get('home')!].filter(Boolean) as mongoose.Types.ObjectId[];
    await assignMenusToRole(roleMap.get('user')!, userMenuIds, '普通用户');

    console.log('✅ 菜单权限分配完成');

    // ==================== 5. 创建用户 ====================
    console.log('\n👤 5. 创建用户...');

    const users = [
      { account: 'superadmin', password: 'SuperAdmin_123', username: '系统超级管理员', deptId: deptMap.get('root')!, phone: '13800000001', email: 'superadmin@example.com' },
      { account: 'admin', password: 'Admin_123', username: '系统管理员', deptId: deptMap.get('root')!, phone: '13800000002', email: 'admin@example.com' },
      { account: 'manager', password: 'Manager_123', username: '技术部经理', deptId: deptMap.get('dev')!, phone: '13800000003', email: 'manager@example.com' },
      { account: 'developer', password: 'Developer_123', username: '开发工程师', deptId: deptMap.get('dev')!, phone: '13800000004', email: 'developer@example.com' },
      { account: 'user', password: 'User_123', username: '普通用户', deptId: deptMap.get('dev')!, phone: '13800000005', email: 'user@example.com' },
    ];

    const userMap = new Map<string, mongoose.Types.ObjectId>();

    for (const user of users) {
      const existing = await UserModel.findOne({ account: user.account });
      if (!existing) {
        const newUser = await UserModel.create(user);
        userMap.set(user.account, newUser._id);
        console.log(`   ✅ 创建用户: ${user.username} (${user.account})`);
      } else {
        userMap.set(user.account, existing._id);
        console.log(`   ℹ️  用户已存在: ${user.username} (${user.account})`);
      }
    }

    console.log('✅ 用户创建完成');

    // ==================== 6. 为用户分配角色 ====================
    console.log('\n🎭 6. 为用户分配角色...');

    // 用户角色映射
    const userRoleMapping = [
      { userAccount: 'superadmin', roleName: 'super_admin' },
      { userAccount: 'admin', roleName: 'admin' },
      { userAccount: 'manager', roleName: 'dept_manager' },
      { userAccount: 'developer', roleName: 'developer' },
      { userAccount: 'user', roleName: 'user' },
    ];

    for (const mapping of userRoleMapping) {
      const userId = userMap.get(mapping.userAccount);
      const roleId = roleMap.get(mapping.roleName);

      if (userId && roleId) {
        const existing = await UserRoleModel.findOne({ userId, roleId });
        if (!existing) {
          await UserRoleModel.create({ userId, roleId });
          console.log(`   ✅ 分配角色: ${mapping.userAccount} -> ${mapping.roleName}`);
        } else {
          console.log(`   ℹ️  角色已分配: ${mapping.userAccount} -> ${mapping.roleName}`);
        }
      }
    }

    console.log('✅ 角色分配完成');

    // ==================== 7. 设置数据权限 ====================
    console.log('\n🗺️  7. 设置数据权限...');

    // 为部门主管设置本部门数据权限
    const deptManagerRoleId = roleMap.get('dept_manager');
    const devDeptId = deptMap.get('dev');

    if (deptManagerRoleId && devDeptId) {
      const existing = await RoleDeptModel.findOne({ roleId: deptManagerRoleId, deptId: devDeptId });
      if (!existing) {
        await RoleDeptModel.create({ roleId: deptManagerRoleId, deptId: devDeptId });
        console.log('   ✅ 为部门主管设置技术部数据权限');
      }
    }

    console.log('✅ 数据权限设置完成');

    // ==================== 8. 输出结果 ====================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 增强版数据库初始化完成！');
    console.log('='.repeat(60));

    console.log('\n📊 初始化统计:');
    console.log(`   部门数量: ${deptMap.size}`);
    console.log(`   角色数量: ${roleMap.size}`);
    console.log(`   菜单数量: ${menuMap.size}`);
    console.log(`   用户数量: ${userMap.size}`);

    console.log('\n🔑 测试账号信息:');
    console.log('   ----------------------------------------');
    console.log('   超级管理员:');
    console.log('     账号: superadmin');
    console.log('     密码: SuperAdmin_123');
    console.log('     权限: 所有菜单权限');
    console.log('   ----------------------------------------');
    console.log('   系统管理员:');
    console.log('     账号: admin');
    console.log('     密码: Admin_123');
    console.log('     权限: 系统管理 + 业务管理');
    console.log('   ----------------------------------------');
    console.log('   部门经理:');
    console.log('     账号: manager');
    console.log('     密码: Manager_123');
    console.log('     权限: 用户管理 + 项目管理 + 任务管理');
    console.log('   ----------------------------------------');
    console.log('   开发人员:');
    console.log('     账号: developer');
    console.log('     密码: Developer_123');
    console.log('     权限: 项目管理 + 任务管理');
    console.log('   ----------------------------------------');
    console.log('   普通用户:');
    console.log('     账号: user');
    console.log('     密码: User_123');
    console.log('     权限: 仪表盘');
    console.log('   ----------------------------------------');

    console.log('\n⚠️  安全提示:');
    console.log('   1. 请及时修改默认密码！');
    console.log('   2. 生产环境请使用强密码！');
    console.log('   3. 定期检查用户权限！');

    console.log('\n🚀 初始化完成，可以启动应用了！');

    // 断开数据库连接
    await mongoose.disconnect();
    console.log('✅ 数据库连接已断开');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

/**
 * 为角色分配菜单权限
 */
async function assignMenusToRole(roleId: mongoose.Types.ObjectId, menuIds: mongoose.Types.ObjectId[], roleLabel: string) {
  let assignedCount = 0;

  for (const menuId of menuIds) {
    const existing = await RoleMenuModel.findOne({ roleId, menuId });
    if (!existing) {
      await RoleMenuModel.create({ roleId, menuId });
      assignedCount++;
    }
  }

  console.log(`   ✅ ${roleLabel}: 分配了 ${assignedCount} 个菜单权限`);
}

// 直接运行初始化
initEnhancedDatabase();

export { initEnhancedDatabase };
