// src/utils/errorHandler.ts
/**
 * 通用错误处理工具
 * 提供统一的错误处理和响应格式化
 */

import { OK, CREATED, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_SERVER_ERROR } from '@/constants';
import type { ExpressResponse } from '@/types/express';

// 错误类型定义
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// 错误映射配置
export const ERROR_MAPPINGS = {
  // 认证相关错误
  '请先登录': UNAUTHORIZED,
  '未登录': UNAUTHORIZED,
  'token无效': UNAUTHORIZED,
  '用户不存在': UNAUTHORIZED,
  '用户名或密码错误': UNAUTHORIZED,
  '认证失败': UNAUTHORIZED,
  
  // 权限相关错误
  '没有操作权限': FORBIDDEN,
  '权限检查失败': FORBIDDEN,
  '数据权限检查失败': FORBIDDEN,
  '角色检查失败': FORBIDDEN,
  
  // 验证相关错误
  '不能为空': BAD_REQUEST,
  '验证码': BAD_REQUEST,
  '不一致': BAD_REQUEST,
  '错误': BAD_REQUEST,
  '参数错误': BAD_REQUEST,
  '数据验证失败': BAD_REQUEST,
  '格式不正确': BAD_REQUEST,
  
  // 资源冲突错误
  '已被注册': CONFLICT,
  '已被其他用户使用': CONFLICT,
  '已存在': CONFLICT,
  '重复': CONFLICT,
  
  // 资源不存在错误
  '不存在': NOT_FOUND,
  '未找到': NOT_FOUND,
  '找不到': NOT_FOUND,
  
  // 业务逻辑错误
  '请选择要删除的': BAD_REQUEST,
  '操作失败': BAD_REQUEST,
} as const;

// 创建应用错误
export function createAppError(
  message: string,
  options: {
    statusCode?: number;
    code?: string;
    details?: any;
  } = {}
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = options.statusCode || getStatusCodeFromMessage(message);
  error.code = options.code;
  error.details = options.details;
  return error;
}

// 根据错误消息获取状态码
export function getStatusCodeFromMessage(message: string): number {
  for (const [keyword, statusCode] of Object.entries(ERROR_MAPPINGS)) {
    if (message.includes(keyword)) {
      return statusCode;
    }
  }
  return INTERNAL_SERVER_ERROR;
}

// 通用错误处理函数
export function handleError(
  error: any,
  res: ExpressResponse,
  context: string = '操作失败'
): void {
  console.error(`${context}:`, error);
  
  const statusCode = error.statusCode || getStatusCodeFromMessage(error.message);
  const errorMessage = error.message || '服务器内部错误';
  
  res.status(statusCode).json({
    code: statusCode,
    msg: errorMessage,
    ...(error.details && { details: error.details }),
  });
}

// 通用成功响应
export function successResponse(
  res: ExpressResponse,
  data?: any,
  message: string = '操作成功'
): void {
  res.status(OK).json({
    code: OK,
    msg: message,
    ...(data !== undefined && { data }),
  });
}

// 创建成功响应（用于创建资源）
export function createdResponse(
  res: ExpressResponse,
  data: any,
  message: string = '创建成功'
): void {
  res.status(CREATED).json({
    code: CREATED,
    msg: message,
    data,
  });
}

// 检查用户是否已认证
export function checkAuth(req: any): string {
  if (!req.user?.userId) {
    throw createAppError('请先登录', { statusCode: UNAUTHORIZED });
  }
  return req.user.userId;
}

// 检查必需参数
export function checkRequiredParams(params: Record<string, any>, requiredFields: string[]): void {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (params[field] === undefined || params[field] === null || params[field] === '') {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw createAppError(`参数 ${missingFields.join(', ')} 不能为空`, {
      statusCode: BAD_REQUEST,
      details: { missingFields },
    });
  }
}

// 检查数组参数
export function checkArrayParam(param: any, paramName: string, minLength: number = 1): void {
  if (!Array.isArray(param)) {
    throw createAppError(`${paramName} 必须是数组`, { statusCode: BAD_REQUEST });
  }
  
  if (param.length < minLength) {
    throw createAppError(`${paramName} 不能为空`, { statusCode: BAD_REQUEST });
  }
}