import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { dataScope } from '@/middlewares/dataScope.ts';
import { RateLimiterUtil } from '@/utils/rateLimiter';
import utils from '@/utils/utils';
import vaiedation from '@/validation';

const router = express.Router();
// 注册
router.post('/register', RateLimiterUtil.register, vaiedation.userViedation.registerVie.register, utils.handleValidationErrors, controller.userController.register);
// 登录
router.post('/login', RateLimiterUtil.login, vaiedation.userViedation.login, utils.handleValidationErrors, controller.userController.login);
// 修改密码
router.post('/upDatePsw', authenticate, controller.userController.changePassword);
// 退出登录
router.post('/loginOut', authenticate, controller.userController.logout);
// 修改用户信息
router.post('/upDateUserInfo', authenticate, vaiedation.userViedation.updateUserInfo.updateUserInfo, utils.handleValidationErrors, controller.userController.updateUserInfo);
// 获取用户详情
router.get('/detail/:id', authenticate, dataScope({ deptAlias: 'dept', userAlias: 'user' }), controller.userController.getUserDetail);
// 获取用户列表
router.get('/list', authenticate, dataScope({ deptAlias: 'dept', userAlias: 'user' }), controller.userController.getUserList);
// 创建用户
router.post('/create', authenticate, controller.userController.createUser);
// 更新用户
router.put('/update/:id', authenticate, controller.userController.updateUser);
// 删除用户
router.delete('/delete/:id', authenticate, controller.userController.deleteUser);
// 批量删除用户
router.post('/batch-delete', authenticate, controller.userController.batchDeleteUsers);
// 获取当前用户信息
router.get('/current', authenticate, controller.userController.getCurrentUser);
export default router;
