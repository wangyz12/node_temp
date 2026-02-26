import express from 'express';
import controller from '@/controller/index.ts';
import vaiedation from '@/vaiedation/index.ts';
const router = express.Router();
// 注册
router.post(
  '/register',
  vaiedation.userViedation.registerVie.register,
  vaiedation.userViedation.registerVie.handleValidationErrors,
  controller.userController.register
);
// 登录
router.post(
  '/login',
  vaiedation.userViedation.registerVie.register,
  vaiedation.userViedation.registerVie.handleValidationErrors,
  controller.userController.login
);
// 修改密码
router.post(
  '/upDatePsw',
  // vaiedation.testViedation.validateCreateTest,
  controller.userController.upDatePsw
);
// 退出登录
router.post(
  '/loginOut',
  // vaiedation.testViedation.validateCreateTest,
  controller.userController.loginOut
);
// 修改用户信息
router.post(
  '/upDateUserInfo',
  // vaiedation.testViedation.validateCreateTest,
  controller.userController.upDateUserInfo
);
export default router;
