import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/validation';
import { authenticate } from '@/middlewares/auth.ts';
const router = express.Router();
// 添加菜单
router.post('/addMenu', authenticate, vaiedation.menuViedation.addMenu, controller.menuController.addMenu);
// 修改菜单
router.post('/updateMenu', authenticate, vaiedation.menuViedation.addMenu, controller.menuController.updateMenu);
// 删除菜单
router.post('/delMenu', authenticate, controller.menuController.delMenu);
// 查询菜单
router.get('/findMenu', authenticate, controller.menuController.findMenu);
export default router;
