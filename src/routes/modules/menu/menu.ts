import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';
import vaiedation from '@/validation';

const router = express.Router();
router.use(authenticate);

// 获取菜单树
router.get('/tree', checkPermission('system:menu:list'), controller.menuController.findMenu);

// 添加菜单
router.post('/addMenu', checkPermission('system:menu:add'), controller.menuController.addMenu);

// 修改菜单
router.post('/updateMenu', checkPermission('system:menu:edit'), controller.menuController.updateMenu);

// 删除菜单
router.post('/delMenu', checkPermission('system:menu:remove'), controller.menuController.delMenu);

// 查询菜单
router.get('/findMenu', checkPermission('system:menu:list'), controller.menuController.findMenu);

// RESTful风格接口（兼容前端）
// 更新菜单
router.put('/update/:id', checkPermission('system:menu:edit'), controller.menuController.updateMenuRest);
// 删除菜单
router.delete('/delete/:id', checkPermission('system:menu:remove'), controller.menuController.deleteMenuRest);
// 获取所有菜单（简单列表）
router.get('/all', checkPermission('system:menu:list'), controller.menuController.getAllMenus);

export default router;
