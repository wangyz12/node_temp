// src/controller/modules/dept/deptController.ts
/**
 * 部门控制器
 *
 * 负责处理部门相关的HTTP请求，包括：
 * - 部门树形结构查询
 * - 部门的创建、更新、删除
 * - 部门详情查询
 * - 部门用户统计
 *
 * 控制器层只负责HTTP请求/响应处理，业务逻辑在Service层实现。
 *
 * @module DeptController
 */

import { DeptService } from '@/services/dept.service';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import { handleError, successResponse, createdResponse, checkRequiredParams } from '@/utils/errorHandler';

const deptService = new DeptService();

// ==================== 控制器方法 ====================

/**
 * 获取部门树形结构
 * @route GET /api/depts/tree
 * @header Authorization Bearer {token}
 * @query {string} status - 状态（可选）
 * @query {string} keyword - 搜索关键词（可选）
 * @returns {object} 部门树形结构
 */
const getDeptTree = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const tree = await deptService.getDeptTree(req.query);
    successResponse(res, tree, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取部门树失败');
  }
};

/**
 * 获取部门详情
 * @route GET /api/depts/detail/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 部门ID
 * @returns {object} 部门详细信息
 */
const getDeptDetail = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const dept = await deptService.getDeptDetail(id as any);
    successResponse(res, dept, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取部门详情失败');
  }
};

/**
 * 创建部门
 * @route POST /api/depts/create
 * @header Authorization Bearer {token}
 * @param {string} name - 部门名称
 * @param {string} parentId - 父部门ID（可选，为空表示顶级部门）
 * @param {number} orderNum - 排序号（可选）
 * @param {string} leader - 负责人（可选）
 * @param {string} phone - 联系电话（可选）
 * @param {string} email - 邮箱（可选）
 * @param {string} status - 状态（可选）
 * @returns {object} 创建的部门信息
 */
const createDept = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { name, parentId, orderNum, leader, phone, email, status } = req.body;
    checkRequiredParams({ name }, ['name']);

    const dept = await deptService.createDept({ name, parentId, orderNum, leader, phone, email, status });
    createdResponse(res, dept, '部门创建成功');
  } catch (error: any) {
    handleError(error, res, '创建部门失败');
  }
};

/**
 * 更新部门
 * @route PUT /api/depts/update/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 部门ID
 * @body {object} data - 更新数据
 * @returns {object} 更新后的部门信息
 */
const updateDept = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const dept = await deptService.updateDept(id as any, req.body);
    successResponse(res, dept, '部门更新成功');
  } catch (error: any) {
    handleError(error, res, '更新部门失败');
  }
};

/**
 * 删除部门
 * @route DELETE /api/depts/delete/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 部门ID
 * @returns {object} 操作结果
 */
const deleteDept = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    await deptService.deleteDept(id as any);
    successResponse(res, null, '部门删除成功');
  } catch (error: any) {
    handleError(error, res, '删除部门失败');
  }
};

/**
 * 获取所有部门（用于下拉选择）
 * @route GET /api/depts/all
 * @header Authorization Bearer {token}
 * @returns {object} 所有部门列表
 */
const getAllDepts = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const depts = await deptService.getAllDepts();
    successResponse(res, depts, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取所有部门失败');
  }
};

/**
 * 获取部门用户统计
 * @route GET /api/depts/user-stats
 * @header Authorization Bearer {token}
 * @returns {object} 各部门用户数量统计
 */
const getDeptUserStats = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const stats = await deptService.getDeptUserStats();
    successResponse(res, stats, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取部门用户统计失败');
  }
};

export default {
  getDeptTree,
  getDeptDetail,
  createDept,
  updateDept,
  deleteDept,
  getAllDepts,
  getDeptUserStats,
};
