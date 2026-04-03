// src/app.ts
import express, { Express, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import loggerMiddleware from '@/middlewares/logger.ts';
import { startCaptchaCleaner } from '@/utils/captcha.ts';
import { RateLimiterUtil } from '@/utils/rateLimiter.ts';

import { computedEnv as env } from './config/env.ts';
import { SecurityConfig } from './config/security.ts';
import router from './routes/index.ts'
import { OK, CREATED, NO_CONTENT, BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, TOO_MANY_REQUESTS, INTERNAL_SERVER_ERROR, NOT_IMPLEMENTED, BAD_GATEWAY, SERVICE_UNAVAILABLE } from '@/constants/httpStatus';
import './utils/global.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

startCaptchaCleaner(30);

if (!process.env.PORT) {
  console.warn('⚠️ PORT 环境变量未设置，将使用默认值 3000');
}
console.log(`🌍 当前环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚪 端口: ${process.env.PORT || 3000}`);

const app: Express = express();

// ==================== 1. 健康检查（必须最前面） ====================
app.get('/health', (req, res) => {
  res.status(OK).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ==================== 2. 基础中间件 ====================
app.use(loggerMiddleware);
app.use(cors());

// ==================== 3. 安全中间件 ====================
app.use(SecurityConfig.hideServerInfo);
app.use(SecurityConfig.helmetConfig);
app.use(SecurityConfig.frameguard);

// ==================== 4. 限流 ====================
app.use(RateLimiterUtil.general);

// ==================== 5. 请求体解析（只保留一份）====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 6. 安全过滤 ====================
app.use(SecurityConfig.xssMiddleware);
app.use(SecurityConfig.sanitizeMiddleware);
app.use(cookieParser());

// ==================== 7. 静态文件 ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== 8. API 路由 ====================
// 添加调试日志，确认路由是否正确挂载
console.log('✅ 路由注册开始...');
console.log('API_PREFIX:', env.API_PREFIX);
app.use(env.API_PREFIX, router);
console.log('✅ 路由注册完成');

// ==================== 9. 404 处理 ====================
app.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(NOT_FOUND).json({ code: NOT_FOUND, message: '接口不存在' });
});

// ==================== 10. 错误处理 ====================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ 服务器错误:', err.stack);
  res.status(INTERNAL_SERVER_ERROR).json({ code: INTERNAL_SERVER_ERROR, message: '服务器内部错误' });
});

export default app;
