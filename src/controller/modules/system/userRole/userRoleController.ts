// src/controller/modules/userRole/userRoleController.ts
/**
 * 用户角色控制器
 *
 * 负责处理用户角色相关的HTTP请求，包括：
 * - 为用户分配角色
 * - 获取用户的角色列表
 * - 移除用户的角色
 * - 批量操作用户角色
 *
 * 控制器层只负责HTTP请求/响应处理，业务逻辑在Service层实现。
 *
 * @module UserRoleController
 */

import { UserRoleService } from '@/services/system/userRole.service';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import { handleError, successResponse, checkAuth, checkRequiredParams, checkArrayParam } from '@/utils/errorHandler.ts';

const userRoleService = new UserRoleService();

// ==================== 控制器方法 ====================

/**
 * 为用户分配角色
 * @route POST /api/user-role/assign
 * @header Authorization Bearer {token}
 * @param {string} userId - 用户ID
 * @param {string[]} roleIds - 角色ID数组
 * @returns {object} 操作结果
 */
const assignUserRoles = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 分配用户角色
  // ============================================================
  //
  // 当前版本：仅预留数据权限接口，未实现具体过滤逻辑。
  //
  // 原因：作为模板项目，保持简洁，让使用者自行扩展。
  //
  // 生产环境如需数据权限，请按以下步骤实现：
  //
  // 1. 在中间件中计算 dataScope
  // 2. 根据角色获取有权限的部门ID列表
  // 3. 将 deptIds 传入此处进行过滤
  //
  // 示例代码：
  // if (dataScope?.deptIds?.length) {
  //   conditions.deptId = { $in: dataScope.deptIds };
  // }
  // ============================================================
  try {
    const { userId, roleIds } = req.body;
    checkRequiredParams({ userId, roleIds }, ['userId', 'roleIds']);
    checkArrayParam(roleIds, 'roleIds');

    await userRoleService.assignRolesToUser(userId, roleIds);
    successResponse(res, null, '角色分配成功');
  } catch (error: any) {
    handleError(error, res, '分配用户角色失败');
  }
};

/**
 * 获取用户的角色列表
 * @route GET /api/user-role/user/:userId
 * @header Authorization Bearer {token}
 * @param {string} userId - 用户ID
 * @returns {object} 用户的角色列表
 */
const getUserRoles = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = req.params.userId;
    checkRequiredParams({ userId }, ['userId']);

    const roles = await userRoleService.getUserRoles(userId as string);
    successResponse(res, roles, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户角色失败');
  }
};

/**
 * 移除用户的角色
 * @route DELETE /api/user-role/remove
 * @header Authorization Bearer {token}
 * @param {string} userId - 用户ID
 * @param {string} roleId - 角色ID
 * @returns {object} 操作结果
 */
const removeUserRole = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 移除用户角色
  // ============================================================
  //
  // 当前版本：仅预留数据权限接口，未实现具体过滤逻辑。
  //
  // 原因：作为模板项目，保持简洁，让使用者自行扩展。
  //
  // 生产环境如需数据权限，请按以下步骤实现：
  //
  // 1. 在中间件中计算 dataScope
  // 2. 根据角色获取有权限的部门ID列表
  // 3. 将 deptIds 传入此处进行过滤
  //
  // 示例代码：
  // if (dataScope?.deptIds?.length) {
  //   conditions.deptId = { $in: dataScope.deptIds };
  // }
  // ============================================================
  try {
    const { userId, roleId } = req.body;
    checkRequiredParams({ userId, roleId }, ['userId', 'roleId']);

    await userRoleService.removeRoleFromUser(userId, roleId);
    successResponse(res, null, '角色移除成功');
  } catch (error: any) {
    handleError(error, res, '移除用户角色失败');
  }
};

/**
 * 批量操作用户角色
 * @route POST /api/user-role/batch
 * @header Authorization Bearer {token}
 * @param {string} userId - 用户ID
 * @param {string[]} addRoleIds - 要添加的角色ID数组（可选）
 * @param {string[]} removeRoleIds - 要移除的角色ID数组（可选）
 * @returns {object} 操作结果
 */
const batchUserRoleOperation = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 批量操作用户角色
  // ============================================================
  //
  // 当前版本：仅预留数据权限接口，未实现具体过滤逻辑。
  //
  // 原因：作为模板项目，保持简洁，让使用者自行扩展。
  //
  // 生产环境如需数据权限，请按以下步骤实现：
  //
  // 1. 在中间件中计算 dataScope
  // 2. 根据角色获取有权限的部门ID列表
  // 3. 将 deptIds 传入此处进行过滤
  //
  // 示例代码：
  // if (dataScope?.deptIds?.length) {
  //   conditions.deptId = { $in: dataScope.deptIds };
  // }
  // ============================================================
  try {
    const { userId, addRoleIds = [], removeRoleIds = [] } = req.body;
    checkRequiredParams({ userId }, ['userId']);

    if (addRoleIds.length > 0) {
      checkArrayParam(addRoleIds, 'addRoleIds');
    }

    if (removeRoleIds.length > 0) {
      checkArrayParam(removeRoleIds, 'removeRoleIds');
    }

    await userRoleService.batchUserRoleOperation(userId, addRoleIds, removeRoleIds);
    successResponse(res, null, '批量操作成功');
  } catch (error: any) {
    handleError(error, res, '批量操作用户角色失败');
  }
};

/**
 * 获取角色下的用户列表
 * @route GET /api/user-role/role/:roleId
 * @header Authorization Bearer {token}
 * @param {string} roleId - 角色ID
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认10）
 * @returns {object} 用户列表和分页信息
 */
const getRoleUsers = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const roleId = req.params.roleId;
    const { page = 1, limit = 10 } = req.query;
    checkRequiredParams({ roleId }, ['roleId']);
    const result = await userRoleService.getRoleUsers(roleId as string, { page, limit } as any);
    successResponse(res, result, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取角色用户列表失败');
  }
};

/**
 * 检查用户是否拥有指定角色
 * @route GET /api/user-role/check
 * @header Authorization Bearer {token}
 * @param {string} userId - 用户ID
 * @param {string} roleId - 角色ID
 * @returns {object} 检查结果
 */
const checkUserRole = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { userId, roleId } = req.query;
    checkRequiredParams({ userId, roleId }, ['userId', 'roleId']);

    const hasRole = await userRoleService.checkUserHasRole(userId as string, roleId as string);
    successResponse(res, { hasRole }, '检查成功');
  } catch (error: any) {
    handleError(error, res, '检查用户角色失败');
  }
};

/**
 * 批量分配角色（路由兼容性方法）
 * @route POST /api/user-role/batch-assign
 */
const batchAssignRoles = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 批量分配角色
  // ============================================================
  //
  // 当前版本：仅预留数据权限接口，未实现具体过滤逻辑。
  //
  // 原因：作为模板项目，保持简洁，让使用者自行扩展。
  //
  // 生产环境如需数据权限，请按以下步骤实现：
  //
  // 1. 在中间件中计算 dataScope
  // 2. 根据角色获取有权限的部门ID列表
  // 3. 将 deptIds 传入此处进行过滤
  //
  // 示例代码：
  // if (dataScope?.deptIds?.length) {
  //   conditions.deptId = { $in: dataScope.deptIds };
  // }
  // ============================================================
  try {
    const { userIds, roleIds } = req.body;
    checkRequiredParams({ userIds, roleIds }, ['userIds', 'roleIds']);
    checkArrayParam(userIds, 'userIds');
    checkArrayParam(roleIds, 'roleIds');

    const results = await userRoleService.batchUpdateUserRoles(userIds, roleIds);
    successResponse(res, results, '批量分配成功');
  } catch (error: any) {
    handleError(error, res, '批量分配角色失败');
  }
};

/**
 * 获取用户详情（包含角色）
 * @route GET /api/user-role/user/:userId/detail
 */
const getUserWithRoles = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { userId } = req.params;
    checkRequiredParams({ userId }, ['userId']);
    const userWithRoles = await userRoleService.getUserWithRoles(userId as string);
    successResponse(res, userWithRoles, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户详情失败');
  }
};

/**
 * 获取当前用户的菜单权限
 * @route GET /api/user-role/current/menus
 */
const getUserMenus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const menus = await userRoleService.getUserMenus(userId);
    successResponse(res, menus, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户菜单失败');
  }
};

/**
 * 获取当前用户的权限标识
 * @route GET /api/user-role/current/permissions
 */
const getUserPermissions = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const permissions = await userRoleService.getUserPermissions(userId);
    successResponse(res, permissions, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户权限失败');
  }
};

/**
 * 获取当前用户的数据权限
 * @route GET /api/user-role/current/data-scope
 */
const getUserDataScope = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const dataScope = await userRoleService.getUserDataScope(userId);
    successResponse(res, dataScope, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户数据权限失败');
  }
};

/**
 * 检查当前用户是否有某个权限
 * @route POST /api/user-role/current/check-permission
 */
const checkUserPermission = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const { permission } = req.body;
    checkRequiredParams({ permission }, ['permission']);

    const hasPermission = await userRoleService.hasPermission(userId, permission);
    successResponse(res, { hasPermission }, '检查成功');
  } catch (error: any) {
    handleError(error, res, '检查用户权限失败');
  }
};

export default {
  assignUserRoles,
  getUserRoles,
  removeUserRole,
  batchUserRoleOperation,
  getRoleUsers,
  checkUserRole,
  // 路由兼容性方法
  batchAssignRoles,
  getUserWithRoles,
  getUserMenus,
  getUserPermissions,
  getUserDataScope,
  checkUserPermission,
};
