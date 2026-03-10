import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/validation';
import { authenticate } from '@/middlewares/auth.ts';
import { RateLimiterUtil } from '@/utils/rateLimiter';
import utils from '@/utils/utils';
const router = express.Router();
// 注册
router.post('/register', RateLimiterUtil.register, vaiedation.userViedation.registerVie.register, utils.handleValidationErrors, controller.userController.register);
// 登录
router.post('/login', RateLimiterUtil.login, vaiedation.userViedation.registerVie.register, utils.handleValidationErrors, controller.userController.login);
// 修改密码
router.post('/upDatePsw', authenticate, controller.userController.changePassword);
// 退出登录
router.post('/loginOut', authenticate, controller.userController.logout);
// 修改用户信息
router.post('/upDateUserInfo', authenticate, vaiedation.userViedation.updateUserInfo.updateUserInfo, utils.handleValidationErrors, controller.userController.updateUserInfo);
export default router;
