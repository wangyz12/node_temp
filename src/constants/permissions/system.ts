/**
 * 系统管理模块权限常量
 */

export const systemPermissions = {
  // 系统管理总权限
  manage: 'system:manage',
  
  // 用户管理模块
  user: {
    list: 'system:user:list',
    add: 'system:user:add',
    edit: 'system:user:edit',
    delete: 'system:user:delete',
    export: 'system:user:export',
    query: 'system:user:query',
  },
  
  // 角色管理模块
  role: {
    list: 'system:role:list',
    add: 'system:role:add',
    edit: 'system:role:edit',
    remove: 'system:role:remove',
    query: 'system:role:query',
    export: 'system:role:export',
  },
  
  // 菜单管理模块
  menu: {
    list: 'system:menu:list',
    add: 'system:menu:add',
    edit: 'system:menu:edit',
    remove: 'system:menu:remove',
    query: 'system:menu:query',
    delete: 'system:menu:delete',
  },
  
  // 部门管理模块
  dept: {
    list: 'system:dept:list',
    add: 'system:dept:add',
    edit: 'system:dept:edit',
    remove: 'system:dept:remove',
    query: 'system:dept:query',
    export: 'system:dept:export',
  },
} as const;

// 导出类型
export type SystemPermission = typeof systemPermissions;
export type SystemPermissionKey = keyof SystemPermission;