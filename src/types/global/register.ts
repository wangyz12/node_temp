// src/types/global/register.ts
// 这个文件用于声明全局类型

// 直接从 express 导入类型
import type { Request, Response, NextFunction } from 'express';

declare global {
  // 定义 Express 类型别名
  type ExpressRequest = Request;
  type ExpressResponse = Response;
  type ExpressNext = NextFunction;
  
  // 定义控制器类型
  type Controller = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => any;
  type AsyncController = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => Promise<any>;
  type Middleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => void;
  type ErrorMiddleware = (err: any, req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => void;

  // 环境变量配置
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;

      // MongoDB 配置
      MONGODB_URI?: string;
      MONGODB_DB_NAME?: string;

      // PostgreSQL 配置（可选）
      PG_HOST?: string;
      PG_PORT?: string;
      PG_DB_NAME?: string;
      PG_USER?: string;
      PG_PASSWORD?: string;

      // JWT配置
      JWT_SECRET?: string;
      JWT_EXPIRES_IN?: string;

      // API配置
      API_PREFIX?: string;
      CORS_ORIGIN?: string;
    }
  }
}

export {};
