import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/validation';
import { authenticate } from '@/middlewares/auth.ts';
const router = express.Router();
router.use(authenticate);
// 添加菜单
router.post('/addMenu', vaiedation.menuViedation.addMenu, controller.menuController.addMenu);
// 修改菜单
router.post('/updateMenu', vaiedation.menuViedation.addMenu, controller.menuController.updateMenu);
// 删除菜单
router.post('/delMenu', controller.menuController.delMenu);
// 查询菜单
router.get('/findMenu', controller.menuController.findMenu);
export default router;
