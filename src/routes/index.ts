// src/routes/index.ts
import express, { Router } from 'express';
// 统一引入路由
import testRouter from './modules/test/test.ts'; // 测试路由
import userRouter from './modules/users/users.ts';
import menuRouter from './modules/menu/menu.ts';
import captcha from './modules/captcha/captcha.ts';
const router: Router = express.Router();
// 统一注册路由
router.use('/test', testRouter);
router.use('/user', userRouter);
router.use('/menu', menuRouter);
router.use('/captcha', captcha);
export default router;
