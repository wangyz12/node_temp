// src/controller/modules/users/userController.ts
/**
 * 用户控制器
 *
 * 负责处理用户相关的HTTP请求，包括：
 * - 用户注册、登录、登出
 * - 用户信息管理
 * - 密码修改
 * - 用户列表和详情查询
 * - 管理员操作用户
 *
 * 控制器层只负责HTTP请求/响应处理，业务逻辑在Service层实现。
 *
 * @module UserController
 */

import { UserService } from '@/services/system/user.service';
import type { ExpressRequest, ExpressResponse } from '@/types/express.d.ts';
import { handleError, successResponse, createdResponse, checkAuth, checkRequiredParams, checkArrayParam } from '@/utils/errorHandler.ts';

const userService = new UserService();

// ==================== 控制器方法 ====================

/**
 * 用户注册
 * @route POST /api/users/register
 * @param {string} account - 用户账号
 * @param {string} password - 密码
 * @param {string} username - 用户名（可选）
 * @param {string} deptId - 部门ID
 * @param {string} phone - 手机号（可选）
 * @param {string} email - 邮箱（可选）
 * @returns {object} 用户信息和token
 */
const register = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { account, password, username, deptId, phone, email } = req.body;
    checkRequiredParams({ account, password, deptId }, ['account', 'password', 'deptId']);
    const result = await userService.register({ account, password, username, deptId, phone, email });
    successResponse(res, result, '用户创建成功');
  } catch (error: any) {
    handleError(error, res, '注册失败');
  }
};

/**
 * 用户登录
 * @route POST /api/users/login
 * @param {string} account - 用户账号
 * @param {string} password - 密码
 * @param {string} uuid - 验证码UUID
 * @param {string} code - 验证码
 * @returns {object} 用户信息和token
 */
const login = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { account, password, uuid, code } = req.body;
    checkRequiredParams({ account, password, uuid, code }, ['account', 'password', 'uuid', 'code']);
    const result = await userService.login({ account, password, uuid, code });
    successResponse(res, result, '登录成功');
  } catch (error: any) {
    handleError(error, res, '登录失败');
  }
};

/**
 * 修改密码
 * @route POST /api/users/upDatePsw
 * @header Authorization Bearer {token}
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @param {string} confirmPassword - 确认密码
 * @returns {object} 操作结果
 */
const changePassword = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const { oldPassword, newPassword, confirmPassword } = req.body;
    checkRequiredParams({ oldPassword, newPassword, confirmPassword }, ['oldPassword', 'newPassword', 'confirmPassword']);
    await userService.changePassword(userId, { oldPassword, newPassword, confirmPassword });
    successResponse(res, null, '密码修改成功');
  } catch (error: any) {
    handleError(error, res, '修改密码失败');
  }
};

/**
 * 用户登出
 * @route POST /api/users/loginOut
 * @header Authorization Bearer {token}
 * @returns {object} 操作结果
 */
const logout = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    await userService.logout(userId);
    successResponse(res, null, '登出成功');
  } catch (error: any) {
    handleError(error, res, '登出失败');
  }
};

/**
 * 更新用户信息
 * @route POST /api/users/upDateUserInfo
 * @header Authorization Bearer {token}
 * @param {string} username - 用户名（可选）
 * @param {string} avatar - 头像（可选）
 * @param {string} phone - 手机号（可选）
 * @param {string} email - 邮箱（可选）
 * @param {string} deptId - 部门ID（可选）
 * @param {string} status - 状态（可选）
 * @returns {object} 更新后的用户信息
 */
const updateUserInfo = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const user = await userService.updateUserInfo(userId, req.body);
    successResponse(res, user, '用户信息更新成功');
  } catch (error: any) {
    handleError(error, res, '更新用户信息失败');
  }
};

/**
 * 管理员创建用户
 * @route POST /api/users/create
 * @header Authorization Bearer {token}
 * @param {string} account - 用户账号
 * @param {string} password - 密码
 * @param {string} username - 用户名（可选）
 * @param {string} deptId - 部门ID
 * @param {string} phone - 手机号（可选）
 * @param {string} email - 邮箱（可选）
 * @param {string} status - 状态（可选）
 * @param {string[]} roles - 角色ID列表（可选）
 * @returns {object} 创建的用户信息
 */
const createUserByAdmin = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 管理员创建用户
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
    const { account, password, username, deptId, phone, email, status, roles } = req.body;
    checkRequiredParams({ account, password, deptId }, ['account', 'password', 'deptId']);
    const user = await userService.createUserByAdmin({ account, password, username, deptId, phone, email, status, roles });
    createdResponse(res, user, '用户创建成功');
  } catch (error: any) {
    handleError(error, res, '管理员创建用户失败');
  }
};

/**
 * 获取用户列表
 * @route GET /api/users/list
 * @header Authorization Bearer {token}
 * @query {number} page - 页码（默认1）
 * @query {number} limit - 每页数量（默认10）
 * @query {string} keyword - 搜索关键词（可选）
 * @query {string} deptId - 部门ID（可选）
 * @returns {object} 用户列表和分页信息
 */
const getUserList = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const dataScope = req.dataScope;
    const result = await userService.getUserList(req.query, dataScope);
    successResponse(res, result, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户列表失败');
  }
};

/**
 * 获取用户详情
 * @route GET /api/users/detail/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 用户ID
 * @returns {object} 用户详细信息
 */
const getUserDetail = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const id = req.params.id as string;
    const user = await userService.getUserById(id);
    successResponse(res, user, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取用户详情失败');
  }
};

/**
 * 更新用户
 * @route PUT /api/users/update/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 用户ID
 * @body {object} data - 更新数据
 * @returns {object} 更新后的用户信息
 */
const updateUser = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 更新用户
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
    const id = req.params.id as string;
    const user = await userService.updateUser(id, req.body);
    successResponse(res, user, '用户更新成功');
  } catch (error: any) {
    handleError(error, res, '更新用户失败');
  }
};

/**
 * 删除用户
 * @route DELETE /api/users/delete/:id
 * @header Authorization Bearer {token}
 * @param {string} id - 用户ID
 * @returns {object} 操作结果
 */
const deleteUser = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 删除用户
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
    const id = req.params.id as string;
    await userService.deleteUser(id);
    successResponse(res, null, '用户删除成功');
  } catch (error: any) {
    handleError(error, res, '删除用户失败');
  }
};

/**
 * 获取当前用户信息
 * @route GET /api/users/current
 * @header Authorization Bearer {token}
 * @returns {object} 当前用户信息
 */
const getCurrentUser = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = checkAuth(req);
    const user = await userService.getUserById(userId);
    successResponse(res, user, '获取成功');
  } catch (error: any) {
    handleError(error, res, '获取当前用户信息失败');
  }
};

/**
 * 创建用户（createUserByAdmin的别名，用于路由兼容性）
 * @route POST /api/users/create
 * @header Authorization Bearer {token}
 */
const createUser = createUserByAdmin;

/**
 * 批量删除用户
 * @route POST /api/users/batch-delete
 * @header Authorization Bearer {token}
 * @param {string[]} ids - 用户ID数组
 * @returns {object} 操作结果
 */
const batchDeleteUsers = async (req: ExpressRequest, res: ExpressResponse) => {
  // ============================================================
  // 权限控制点 - 批量删除用户
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
    const { ids } = req.body;
    checkArrayParam(ids, 'ids');

    // 逐个删除用户
    for (const id of ids) {
      await userService.deleteUser(id as string);
    }

    successResponse(res, null, '批量删除成功');
  } catch (error: any) {
    handleError(error, res, '批量删除用户失败');
  }
};

export default {
  register,
  login,
  changePassword,
  logout,
  updateUserInfo,
  createUserByAdmin,
  createUser,
  getUserList,
  getUserDetail,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  getCurrentUser,
};
