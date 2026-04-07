// src/controller/modules/test/testController.ts
/**
 * 测试控制器
 * 
 * 用于开发和测试的控制器，包含各种测试接口。
 * 
 * @module TestController
 */

import { testModel } from '@/models/index.ts';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import {
  handleError,
  successResponse,
  createdResponse,
  checkRequiredParams,
} from '@/utils/errorHandler';

// ==================== 控制器方法 ====================

/**
 * 创建测试用户
 * @route POST /api/test/create-user
 * @param {string} name - 用户名
 * @param {string} email - 邮箱
 * @param {number} age - 年龄（可选）
 * @returns {object} 创建的用户信息
 */
const createTestUser = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { name, email, age } = req.body;
    checkRequiredParams({ name, email }, ['name', 'email']);
    
    const user = await testModel.create({ name, email, age });
    
    createdResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      createdAt: user.createdAt,
    }, '测试用户创建成功');
  } catch (error: any) {
    handleError(error, res, '创建测试用户失败');
  }
};

/**
 * 获取测试用户列表
 * @route GET /api/test/users
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认10）
 * @returns {object} 测试用户列表
 */
const getTestUsers = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const [users, total] = await Promise.all([
      testModel.find().skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      testModel.countDocuments(),
    ]);
    
    successResponse(res, {
      list: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取测试用户列表失败');
  }
};

/**
 * 健康检查接口
 * @route GET /api/test/health
 * @returns {object} 服务状态
 */
const healthCheck = async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    successResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Test API',
      version: '1.0.0',
    }, '服务运行正常');
  } catch (error: any) {
    handleError(error, res, '健康检查失败');
  }
};

/**
 * 性能测试接口
 * @route GET /api/test/performance
 * @returns {object} 性能测试结果
 */
const performanceTest = async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    const startTime = Date.now();
    
    // 模拟一些操作
    await testModel.countDocuments();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    successResponse(res, {
      operation: 'database_count',
      duration_ms: duration,
      status: duration < 100 ? 'excellent' : duration < 500 ? 'good' : 'slow',
      timestamp: new Date().toISOString(),
    }, '性能测试完成');
  } catch (error: any) {
    handleError(error, res, '性能测试失败');
  }
};

/**
 * 错误测试接口（用于测试错误处理）
 * @route GET /api/test/error
 * @query {string} type - 错误类型（validation, conflict, not_found, server）
 * @returns {object} 错误响应
 */
const errorTest = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { type = 'server' } = req.query;
    
    switch (type) {
      case 'validation':
        throw new Error('数据验证失败：用户名不能为空');
      case 'conflict':
        throw new Error('邮箱已被注册');
      case 'not_found':
        throw new Error('用户不存在');
      case 'server':
      default:
        throw new Error('服务器内部错误');
    }
  } catch (error: any) {
    handleError(error, res, '错误测试');
  }
};

// 兼容性方法（保持向后兼容）
const query = createTestUser;

export default {
  createTestUser,
  getTestUsers,
  healthCheck,
  performanceTest,
  errorTest,
  query, // 兼容性导出
};