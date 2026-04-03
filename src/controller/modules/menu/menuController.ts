// src/controller/modules/menu/menuController.ts
/**
 * 菜单控制器
 *
 * 负责处理菜单相关的HTTP请求，包括：
 * - 菜单树形结构查询
 * - 菜单的创建、更新、删除
 * - 菜单详情查询
 *
 * 控制器层只负责HTTP请求/响应处理，业务逻辑在Service层实现。
 *
 * @module MenuController
 */

import { MenuService } from '@/services/menu.service';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import { handleError, successResponse, createdResponse, checkRequiredParams } from '@/utils/errorHandler';

const menuService = new MenuService();

// ==================== 控制器方法 ====================

/**
 * 获取菜单树形结构
 * @route GET /api/menus/tree
 * @header Authorization Bearer {token}
 * @query {string} type - 菜单类型（可选：menu, button, iframe）
 * @returns {object} 菜单树形结构
 */
const getMenuTree = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const tree = await menuService.getMenuTree(req.query);
    successResponse(res, tree, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取菜单树失败');
  }
};

/**
 * 获取所有菜单（简单列表）
 * @route GET /api/menus/all
 * @header Authorization Bearer {token}
 * @returns {object} 所有菜单列表
 */
const getAllMenus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const menus = await menuService.getAllMenus();
    successResponse(res, menus, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取所有菜单失败');
  }
};

/**
 * 获取菜单详情
 * @route GET /api/menus/detail/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 菜单ID
 * @returns {object} 菜单详细信息
 */
const getMenuDetail = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const menu = await menuService.getMenuDetail(id as string);
    successResponse(res, menu, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取菜单详情失败');
  }
};

/**
 * 创建菜单
 * @route POST /api/menus/create
 * @header Authorization Bearer {token}
 * @param {string} name - 菜单名称（唯一）
 * @param {string} path - 路由路径
 * @param {string} component - 组件路径
 * @param {string} title - 菜单标题
 * @param {string} icon - 菜单图标（可选）
 * @param {number} sort - 排序号（可选）
 * @param {string} pid - 父菜单ID（可选，为空表示顶级菜单）
 * @param {string} type - 菜单类型（可选：menu, button, iframe，默认menu）
 * @param {boolean} hidden - 是否隐藏（可选）
 * @param {boolean} cache - 是否缓存（可选）
 * @param {string[]} permissions - 权限标识列表（可选）
 * @param {boolean} external - 是否外部链接（可选）
 * @param {string} target - 打开方式（可选：_self, _blank，默认_self）
 * @returns {object} 创建的菜单信息
 */
const createMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { name, path, component, title, icon, sort, pid, type, hidden, cache, permissions, external, target } = req.body;
    checkRequiredParams({ name, path, component, title }, ['name', 'path', 'component', 'title']);

    const menu = await menuService.createMenu({ name, path, component, title, icon, sort, pid, type, hidden, cache, permissions, external, target });
    createdResponse(res, menu, '菜单创建成功');
  } catch (error: any) {
    handleError(error, res, '创建菜单失败');
  }
};

/**
 * 更新菜单
 * @route PUT /api/menus/update/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 菜单ID
 * @body {object} data - 更新数据
 * @returns {object} 更新后的菜单信息
 */
const updateMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const menu = await menuService.updateMenu(id as string, req.body);
    successResponse(res, menu, '菜单更新成功');
  } catch (error: any) {
    handleError(error, res, '更新菜单失败');
  }
};

/**
 * 删除菜单
 * @route DELETE /api/menus/delete/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 菜单ID
 * @returns {object} 操作结果
 */
const deleteMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    await menuService.deleteMenu(id as string);
    successResponse(res, null, '菜单删除成功');
  } catch (error: any) {
    handleError(error, res, '删除菜单失败');
  }
};

/**
 * 检查菜单是否存在
 * @route GET /api/menus/check/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 菜单ID
 * @returns {object} 检查结果
 */
const checkMenuExists = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const exists = await menuService.checkMenuExists(id as string);
    successResponse(res, { exists }, '检查成功');
  } catch (error: any) {
    handleError(error, res, '检查菜单失败');
  }
};

/**
 * 获取菜单类型统计
 * @route GET /api/menus/type-stats
 * @header Authorization Bearer {token}
 * @returns {object} 菜单类型统计
 */
const getMenuTypeStats = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const stats = await menuService.getMenuTypeStats();
    successResponse(res, stats, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取菜单类型统计失败');
  }
};

export default {
  getMenuTree,
  getAllMenus,
  getMenuDetail,
  createMenu,
  updateMenu,
  deleteMenu,
  checkMenuExists,
  getMenuTypeStats,
};
