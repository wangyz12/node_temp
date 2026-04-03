import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';

const router = express.Router();
router.use(authenticate);

// RESTful风格接口
// 获取菜单树
router.get('/tree', checkPermission('system:menu:list'), controller.menuController.getMenuTree);

// 获取所有菜单（简单列表）
router.get('/all', checkPermission('system:menu:list'), controller.menuController.getAllMenus);

// 获取菜单详情
router.get('/detail/:id', checkPermission('system:menu:query'), controller.menuController.getMenuDetail);

// 创建菜单
router.post('/create', checkPermission('system:menu:add'), controller.menuController.createMenu);

// 更新菜单
router.put('/update/:id', checkPermission('system:menu:edit'), controller.menuController.updateMenu);

// 删除菜单
router.delete('/delete/:id', checkPermission('system:menu:remove'), controller.menuController.deleteMenu);

// 检查菜单是否存在
router.get('/check/:id', checkPermission('system:menu:query'), controller.menuController.checkMenuExists);

// 获取菜单类型统计
router.get('/type-stats', checkPermission('system:menu:list'), controller.menuController.getMenuTypeStats);

// 兼容性路由（保持向后兼容）
router.get('/findMenu', checkPermission('system:menu:list'), controller.menuController.getMenuTree);

export default router;
