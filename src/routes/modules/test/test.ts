import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/vaiedation/index.ts';
const router = express.Router();
/* GET users listing. */
router.post('/test', vaiedation.testViedation.validateCreateTest, controller.testController.query);

export default router;
