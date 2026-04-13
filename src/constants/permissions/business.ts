/**
 * 业务模块权限常量
 */

export const businessPermissions = {
  // 业务管理总权限
  manage: 'business:manage',
  
  // 项目管理模块
  project: {
    list: 'business:project:list',
  },
  
  // 任务管理模块
  task: {
    list: 'business:task:list',
  },
} as const;

// 导出类型
export type BusinessPermission = typeof businessPermissions;
export type BusinessPermissionKey = keyof BusinessPermission;