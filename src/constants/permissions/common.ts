/**
 * 公共模块权限常量
 */

export const commonPermissions = {
  // 首页查看权限
  home: {
    view: 'home:view',
  },
} as const;

// 导出类型
export type CommonPermission = typeof commonPermissions;
export type CommonPermissionKey = keyof CommonPermission;