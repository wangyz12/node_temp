// src/routes/index.ts
import express, { Router } from 'express';
// 统一引入路由
import usersRouter from './modules/test/test.ts';

const router: Router = express.Router();
// 统一注册路由
router.use('/test', usersRouter);

export default router;
