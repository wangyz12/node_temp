// src/routes/modules/role/role.ts
import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';

const router = express.Router();

// 所有角色相关接口都需要认证
router.use(authenticate);

// 获取角色列表
router.get('/list', checkPermission('system:role:list'), controller.roleController.getRoleList);

// 获取所有角色（下拉选择）
router.get('/all', checkPermission('system:role:list'), controller.roleController.getAllRoles);

// 获取角色详情
router.get('/detail/:id', checkPermission('system:role:query'), controller.roleController.getRoleDetail);

// 创建角色
router.post('/create', checkPermission('system:role:add'), controller.roleController.createRole);

// 更新角色
router.put('/update/:id', checkPermission('system:role:edit'), controller.roleController.updateRole);

// 删除角色
router.delete('/delete/:id', checkPermission('system:role:remove'), controller.roleController.deleteRole);

// 获取角色菜单树
router.get('/:roleId/menu-tree', checkPermission('system:role:edit'), controller.roleController.getRoleMenuTree);

// 获取角色部门树
router.get('/:roleId/dept-tree', checkPermission('system:role:edit'), controller.roleController.getRoleDeptTree);

// 获取角色已分配的菜单ID列表
router.get('/:roleId/menus', checkPermission('system:role:edit'), controller.roleController.getRoleMenus);

// 获取角色已分配的部门ID列表
router.get('/:roleId/depts', checkPermission('system:role:edit'), controller.roleController.getRoleDepts);

// 分配角色菜单权限
router.post('/:roleId/assign-menus', checkPermission('system:role:edit'), controller.roleController.assignRoleMenus);

// 分配角色部门权限
router.post('/:roleId/assign-depts', checkPermission('system:role:edit'), controller.roleController.assignRoleDepts);

export default router;
