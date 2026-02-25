// src/types/global/register.ts
import * as ExpressTypes from './express.ts';

declare global {
  // 自动展开Express模块的所有导出
  type ExpressRequest = ExpressTypes.ExpressRequest;
  type ExpressResponse = ExpressTypes.ExpressResponse;
  type ExpressNext = ExpressTypes.ExpressNext;
  type Controller = ExpressTypes.Controller;
  type AsyncController = ExpressTypes.AsyncController;
  type Middleware = ExpressTypes.Middleware;
  type ErrorMiddleware = ExpressTypes.ErrorMiddleware;

  // 环境变量配置
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;
      API_PREFIX?: string;
      CORS_ORIGIN?: string;
    }
  }
}

export {};
