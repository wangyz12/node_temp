// 重构的角色路由 - 更清晰的路由定义
import express from 'express';
import { newRoleController } from '@/controller/modules/role/newRoleController.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';

const router = express.Router();

// 所有角色路由都需要认证
router.use(authenticate);

// 角色列表（需要查询权限）
router.get('/list', checkPermission('system:role:list'), newRoleController.getRoleList);

// 所有角色（用于下拉选择）
router.get('/all', checkPermission('system:role:list'), newRoleController.getAllRoles);

// 角色详情
router.get('/detail/:id', checkPermission('system:role:query'), newRoleController.getRoleDetail);

// 创建角色（需要新增权限）
router.post('/create', checkPermission('system:role:add'), newRoleController.createRole);

// 更新角色（需要编辑权限）
router.put('/update/:id', checkPermission('system:role:edit'), newRoleController.updateRole);

// 删除角色（需要删除权限）
router.delete('/delete/:id', checkPermission('system:role:delete'), newRoleController.deleteRole);

// 获取角色菜单权限
router.get('/:roleId/menus', checkPermission('system:role:query'), newRoleController.getRoleMenus);

// 分配角色菜单权限
router.post('/:roleId/assign-menus', checkPermission('system:role:edit'), newRoleController.assignRoleMenus);

export default router;