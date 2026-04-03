// src/constants/roles.ts
/**
 * 用户角色常量
 * 用于RBAC权限控制系统
 */

// 系统预定义角色
export const ROLES = {
  // 超级管理员：拥有系统所有权限
  SUPER_ADMIN: 'super_admin',
  
  // 系统管理员：管理用户、角色、权限等
  ADMIN: 'admin',
  
  // 普通用户：基本操作权限
  USER: 'user',
  
  // 访客：只读权限
  GUEST: 'guest',
  
  // 部门管理员：管理本部门用户和资源
  DEPT_ADMIN: 'dept_admin',
  
  // 审计员：查看系统日志和操作记录
  AUDITOR: 'auditor',
} as const;

// 角色显示名称
export const ROLE_DISPLAY_NAMES = {
  [ROLES.SUPER_ADMIN]: '超级管理员',
  [ROLES.ADMIN]: '系统管理员',
  [ROLES.USER]: '普通用户',
  [ROLES.GUEST]: '访客',
  [ROLES.DEPT_ADMIN]: '部门管理员',
  [ROLES.AUDITOR]: '审计员',
} as const;

// 角色描述
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]: '拥有系统所有权限，包括用户管理、角色管理、系统设置等',
  [ROLES.ADMIN]: '管理用户、角色、权限等系统核心功能',
  [ROLES.USER]: '拥有基本的业务操作权限',
  [ROLES.GUEST]: '只能查看公开信息，无修改权限',
  [ROLES.DEPT_ADMIN]: '管理本部门用户和资源',
  [ROLES.AUDITOR]: '查看系统日志和操作记录，用于安全审计',
} as const;

// 默认角色（新用户注册时分配）
export const DEFAULT_ROLE = ROLES.USER;

// 角色层级（数字越大权限越高）
export const ROLE_HIERARCHY = {
  [ROLES.GUEST]: 1,
  [ROLES.USER]: 2,
  [ROLES.DEPT_ADMIN]: 3,
  [ROLES.AUDITOR]: 4,
  [ROLES.ADMIN]: 5,
  [ROLES.SUPER_ADMIN]: 6,
} as const;

// 检查角色权限级别
export function hasHigherOrEqualRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole as keyof typeof ROLE_HIERARCHY] || 0;
  return userLevel >= requiredLevel;
}

// 获取所有角色列表
export function getAllRoles(): string[] {
  return Object.values(ROLES);
}

// 获取角色显示名称
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role;
}

// 角色类型
export type RoleType = typeof ROLES[keyof typeof ROLES];