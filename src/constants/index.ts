// src/constants/index.ts
/**
 * 常量模块导出
 * 集中导出所有常量，方便统一导入
 */

// 角色常量
export * from './roles';

// HTTP状态码常量
export * from './httpStatus';

// 常用HTTP状态码快捷导出
export {
  COMMON_HTTP_STATUS,
  SUCCESS_STATUS,
  CLIENT_ERROR_STATUS,
  SERVER_ERROR_STATUS,
  // 常用状态码快捷方式
  OK,
  CREATED,
  NO_CONTENT,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
} from './httpStatus';

// 用户状态常量
export * from './userStatus';

// 版本号
export const VERSION = '1.0.0';

// API版本
export const API_VERSION = 'v1';

// 默认分页配置
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 10,
  maxPageSize: 100,
} as const;