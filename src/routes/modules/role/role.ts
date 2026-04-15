// src/routes/modules/role/role.ts
import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';
import { systemPermissions } from '@/constants/permissions';

const router = express.Router();

// 所有角色相关接口都需要认证
router.use(authenticate);

// 获取角色列表
router.get('/list', checkPermission(systemPermissions.role.list), controller.roleController.getRoleList);

// 获取所有角色（下拉选择）
router.get('/all', controller.roleController.getAllRoles);

// 获取角色详情
router.get('/detail/:id', checkPermission(systemPermissions.role.query), controller.roleController.getRoleDetail);

// 创建角色
router.post('/create', checkPermission(systemPermissions.role.add), controller.roleController.createRole);

// 更新角色
router.put('/update/:id', checkPermission(systemPermissions.role.edit), controller.roleController.updateRole);

// 删除角色
router.delete('/delete/:id', checkPermission(systemPermissions.role.remove), controller.roleController.deleteRole);

// 获取菜单树（通用）
router.get('/menu-tree', checkPermission(systemPermissions.role.edit), controller.roleController.getRoleMenuTree);

// 获取部门树（通用）
router.get('/dept-tree', checkPermission(systemPermissions.role.edit), controller.roleController.getRoleDeptTree);

// 获取角色已分配的菜单ID列表
router.get('/:id/menus', checkPermission(systemPermissions.role.edit), controller.roleController.getRoleMenus);

// 获取角色已分配的部门ID列表
router.get('/:id/depts', checkPermission(systemPermissions.role.edit), controller.roleController.getRoleDepts);

// 分配角色菜单权限
router.post('/:id/assign-menus', checkPermission(systemPermissions.role.edit), controller.roleController.assignRoleMenus);

// 分配角色部门权限
router.post('/:id/assign-depts', checkPermission(systemPermissions.role.edit), controller.roleController.assignRoleDepts);

export default router;
