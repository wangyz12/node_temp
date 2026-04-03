// src/constants/userStatus.ts
/**
 * 用户状态常量
 * 用于用户、角色、部门等实体的状态管理
 */

// 通用状态
export const STATUS = {
  // 正常状态
  ACTIVE: '0',
  // 停用/禁用状态
  INACTIVE: '1',
  // 删除状态（逻辑删除）
  DELETED: '2',
  // 锁定状态
  LOCKED: '3',
  // 待审核状态
  PENDING: '4',
  // 已拒绝状态
  REJECTED: '5',
} as const;

// 状态显示名称
export const STATUS_DISPLAY_NAMES = {
  [STATUS.ACTIVE]: '正常',
  [STATUS.INACTIVE]: '停用',
  [STATUS.DELETED]: '已删除',
  [STATUS.LOCKED]: '已锁定',
  [STATUS.PENDING]: '待审核',
  [STATUS.REJECTED]: '已拒绝',
} as const;

// 状态描述
export const STATUS_DESCRIPTIONS = {
  [STATUS.ACTIVE]: '实体处于正常可用状态',
  [STATUS.INACTIVE]: '实体已被停用，不可用',
  [STATUS.DELETED]: '实体已被逻辑删除',
  [STATUS.LOCKED]: '实体因安全原因被锁定',
  [STATUS.PENDING]: '实体等待审核中',
  [STATUS.REJECTED]: '实体审核未通过',
} as const;

// 默认状态
export const DEFAULT_STATUS = STATUS.ACTIVE;

// 获取状态显示名称
export function getStatusDisplayName(status: string): string {
  return STATUS_DISPLAY_NAMES[status as keyof typeof STATUS_DISPLAY_NAMES] || status;
}

// 检查状态是否可用
export function isActive(status: string): boolean {
  return status === STATUS.ACTIVE;
}

// 检查状态是否停用
export function isInactive(status: string): boolean {
  return status === STATUS.INACTIVE;
}

// 检查状态是否删除
export function isDeleted(status: string): boolean {
  return status === STATUS.DELETED;
}

// 状态类型
export type StatusType = typeof STATUS[keyof typeof STATUS];