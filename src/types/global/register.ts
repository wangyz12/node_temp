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
  
  // 明确声明 Express 命名空间，确保类型一致性
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        account: string;
        username?: string;
        deptId?: string;
        isSuperAdmin?: boolean;
        [key: string]: any;
      };
      dataScope?: {
        deptIds: string[];
        dataScope: string;
        deptAlias: string;
        userAlias: string;
      };
      userPermissions?: {
        menus: any[];
        permissions: string[];
        dataScope: {
          deptIds: string[];
          dataScope: string;
        };
      };
    }
  }

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
