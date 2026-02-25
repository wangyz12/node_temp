// src/types/environment.d.ts
import { Request, Response, NextFunction } from 'express';
declare global {
  // 定义公共的类型
  type ExpressRequest = Request;
  type ExpressResponse = Response;
  type ExpressNext = NextFunction;
  namespace NodeJS {
    interface ProcessEnv {
      // 服务器配置
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';

      // 数据库配置
      DB_HOST?: string;
      DB_PORT?: string;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;

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
