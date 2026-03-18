// src/routes/index.ts
import express, { Router } from 'express';

import captcha from './modules/captcha/captcha.ts';
import deptRouter from './modules/dept/dept.ts';
import menuRouter from './modules/menu/menu.ts';
import roleRouter from './modules/role/role.ts';
// 统一引入路由
import testRouter from './modules/test/test.ts'; // 测试路由
import userRoleRouter from './modules/userRole/userRole.ts';
import userRouter from './modules/users/users.ts';

const router: Router = express.Router();

// 统一注册路由
router.use('/test', testRouter);
router.use('/user', userRouter);
router.use('/menu', menuRouter);
router.use('/role', roleRouter);
router.use('/dept', deptRouter);
router.use('/user-role', userRoleRouter);
router.use('/captcha', captcha);

export default router;
