import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/vaiedation/index.ts';
const router = express.Router();
// 测试接口
router.post('/test', vaiedation.testViedation.validateCreateTest, controller.testController.query);

export default router;
