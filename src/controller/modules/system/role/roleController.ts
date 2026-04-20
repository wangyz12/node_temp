/**
 * 角色控制器
 *
 * 负责处理角色相关的HTTP请求，包括：
 * - 角色列表和详情查询
 * - 角色的创建、更新、删除
 * - 角色菜单权限管理
 * - 角色数据权限管理
 *
 * 控制器层只负责HTTP请求/响应处理，业务逻辑在Service层实现。
 *
 * @module RoleController
 */

import { RoleService } from '@/services/system/role.service';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import { handleError, successResponse, createdResponse, checkRequiredParams, checkArrayParam } from '@/utils/errorHandler';

const roleService = new RoleService();

// ==================== 控制器方法 ====================

/**
 * 获取角色列表
 * @route GET /api/roles/list
 * @header Authorization Bearer {token}
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认10）
 * @query {string} keyword - 搜索关键词（可选）
 * @query {string} status - 状态（可选）
 * @returns {object} 角色列表和分页信息
 */
const getRoleList = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const result = await roleService.getRoleList(req.query, req.dataScope);
    successResponse(res, result, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取角色列表失败');
  }
};

/**
 * 获取角色详情
 * @route GET /api/roles/detail/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @returns {object} 角色详细信息
 */
const getRoleDetail = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const role = await roleService.getRoleDetail(id as string, req.dataScope);
    successResponse(res, role, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取角色详情失败');
  }
};

/**
 * 创建角色
 * @route POST /api/roles/create
 * @header Authorization Bearer {token}
 * @param {string} name - 角色名称
 * @param {string} label - 角色标签
 * @param {string} dataScope - 数据权限范围
 * @param {string} status - 状态（可选）
 * @param {string} remark - 备注（可选）
 * @returns {object} 创建的角色信息
 */
const createRole = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { name, label, dataScope, status, remark } = req.body;
    checkRequiredParams({ name, label, dataScope }, ['name', 'label', 'dataScope']);

    const role = await roleService.createRole({ name, label, dataScope, status, remark });
    createdResponse(res, role, '角色创建成功');
  } catch (error: any) {
    handleError(error, res, '创建角色失败');
  }
};

/**
 * 更新角色
 * @route PUT /api/roles/update/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @body {object} data - 更新数据
 * @returns {object} 更新后的角色信息
 */
const updateRole = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const role = await roleService.updateRole(id as string, req.body);
    successResponse(res, role, '角色更新成功');
  } catch (error: any) {
    handleError(error, res, '更新角色失败');
  }
};

/**
 * 删除角色
 * @route DELETE /api/roles/delete/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @returns {object} 操作结果
 */
const deleteRole = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    await roleService.deleteRole(id as string);
    successResponse(res, null, '角色删除成功');
  } catch (error: any) {
    handleError(error, res, '删除角色失败');
  }
};

/**
 * 获取所有角色（用于下拉选择）
 * @route GET /api/roles/all
 * @header Authorization Bearer {token}
 * @returns {object} 所有角色列表
 */
const getAllRoles = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const roles = await roleService.getAllRoles(req.dataScope);
    successResponse(res, roles, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取所有角色失败');
  }
};

/**
 * 获取角色菜单树
 * @route GET /api/roles/menu-tree
 * @header Authorization Bearer {token}
 * @returns {object} 菜单树结构
 */
const getRoleMenuTree = async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    const menuTree = await roleService.getRoleMenuTree();
    successResponse(res, menuTree, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取菜单树失败');
  }
};

/**
 * 获取角色部门树
 * @route GET /api/roles/dept-tree
 * @header Authorization Bearer {token}
 * @returns {object} 部门树结构
 */
const getRoleDeptTree = async (_req: ExpressRequest, res: ExpressResponse) => {
  try {
    const deptTree = await roleService.getRoleDeptTree();
    successResponse(res, deptTree, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取部门树失败');
  }
};

/**
 * 获取角色的菜单权限
 * @route GET /api/roles/:id/menus
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @returns {object} 角色的菜单列表
 */
const getRoleMenus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const menus = await roleService.getRoleMenus(id as string);
    successResponse(res, menus, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取角色菜单失败');
  }
};

/**
 * 获取角色的数据权限部门
 * @route GET /api/roles/:id/depts
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @returns {object} 角色的部门列表
 */
const getRoleDepts = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    checkRequiredParams({ id }, ['id']);

    const depts = await roleService.getRoleDepts(id as string);
    successResponse(res, depts, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取角色部门失败');
  }
};

/**
 * 为角色分配菜单权限
 * @route POST /api/roles/:id/assign-menus
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @param {string[]} menuIds - 菜单ID数组
 * @returns {object} 操作结果
 */
const assignRoleMenus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    const { menuIds } = req.body;
    checkRequiredParams({ id, menuIds }, ['id', 'menuIds']);
    checkArrayParam(menuIds, 'menuIds');

    await roleService.assignRoleMenus(id as string, menuIds);
    successResponse(res, null, '菜单分配成功');
  } catch (error: any) {
    handleError(error, res, '分配角色菜单失败');
  }
};

/**
 * 为角色分配数据权限部门
 * @route POST /api/roles/:id/assign-depts
 * @header Authorization Bearer {token}
 * @param {string} id - 角色ID
 * @param {string[]} deptIds - 部门ID数组
 * @returns {object} 操作结果
 */
const assignRoleDepts = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    const { deptIds } = req.body;
    checkRequiredParams({ id, deptIds }, ['id', 'deptIds']);
    checkArrayParam(deptIds, 'deptIds');

    await roleService.assignRoleDepts(id as string, deptIds);
    successResponse(res, null, '部门分配成功');
  } catch (error: any) {
    handleError(error, res, '分配角色部门失败');
  }
};

export default {
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  getAllRoles,
  getRoleMenuTree,
  getRoleDeptTree,
  getRoleMenus,
  getRoleDepts,
  assignRoleMenus,
  assignRoleDepts,
};
