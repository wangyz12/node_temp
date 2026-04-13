// src/routes/modules/userRole/userRole.ts
import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';

const router = express.Router();

// 所有用户角色相关接口都需要认证
router.use(authenticate);

// 为用户分配角色
router.post('/assign', checkPermission('system:user:edit'), controller.userRoleController.assignUserRoles);

// 批量分配角色
router.post('/batch-assign', checkPermission('system:user:edit'), controller.userRoleController.batchAssignRoles);

// 获取用户的角色列表
router.get('/user/:userId/roles', checkPermission('system:user:query'), controller.userRoleController.getUserRoles);

// 获取用户详情（包含角色）
router.get('/user/:userId/detail', checkPermission('system:user:query'), controller.userRoleController.getUserWithRoles);

// 获取角色下的用户列表
router.get('/role/:roleId/users', checkPermission('system:role:query'), controller.userRoleController.getRoleUsers);

// 获取当前用户的菜单权限
router.get('/current/menus', controller.userRoleController.getUserMenus);

// 获取当前用户的权限标识
router.get('/current/permissions', controller.userRoleController.getUserPermissions);

// 获取当前用户的数据权限
router.get('/current/data-scope', controller.userRoleController.getUserDataScope);

// 检查当前用户是否有某个权限
router.post('/current/check-permission', controller.userRoleController.checkUserPermission);

// 移除用户的角色
router.delete('/remove', checkPermission('system:user:edit'), controller.userRoleController.removeUserRole);

// 批量操作用户角色
router.post('/batch', checkPermission('system:user:edit'), controller.userRoleController.batchUserRoleOperation);

// 检查用户是否拥有指定角色
router.get('/check', checkPermission('system:user:query'), controller.userRoleController.checkUserRole);

export default router;
