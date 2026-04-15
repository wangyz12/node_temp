import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';
import { systemPermissions } from '@/constants/permissions';

const router = express.Router();
router.use(authenticate);

// RESTful风格接口
// 获取菜单树
router.get('/tree', checkPermission(systemPermissions.menu.list), controller.menuController.getMenuTree);

// 获取所有菜单（简单列表）
router.get('/all', controller.menuController.getMenuTree);

// 获取菜单详情
router.get('/detail/:id', checkPermission(systemPermissions.menu.query), controller.menuController.getMenuDetail);

// 创建菜单
router.post('/create', checkPermission(systemPermissions.menu.add), controller.menuController.createMenu);

// 更新菜单
router.put('/update/:id', checkPermission(systemPermissions.menu.edit), controller.menuController.updateMenu);

// 删除菜单
router.delete('/delete/:id', checkPermission(systemPermissions.menu.remove), controller.menuController.deleteMenu);

// 检查菜单是否存在
router.get('/check/:id', checkPermission(systemPermissions.menu.query), controller.menuController.checkMenuExists);

// 获取菜单类型统计
router.get('/type-stats', checkPermission(systemPermissions.menu.list), controller.menuController.getMenuTypeStats);

// 兼容性路由（保持向后兼容）
router.get('/findMenu', checkPermission(systemPermissions.menu.list), controller.menuController.getMenuTree);

export default router;
