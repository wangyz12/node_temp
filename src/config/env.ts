// src/config/env.ts
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 环境变量工具对象
export const env = {
  // 服务器
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  // PostgreSQL 配置（保留原有）
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT || '5432', 10),
    NAME: process.env.DB_NAME || 'my_admin',
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || '',
    get URL(): string {
      return `postgresql://${this.USER}:${this.PASSWORD}@${this.HOST}:${this.PORT}/${this.NAME}`;
    },
  },

  // MongoDB 配置（新增）
  MONGODB: {
    URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_admin',
    DB_NAME: process.env.MONGODB_DB_NAME || 'my_admin',
    // 连接选项
    OPTIONS: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
    // 获取完整的连接字符串（如果需要）
    get URL(): string {
      return this.URI;
    },
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default-secret-do-not-use-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  },

  // API
  API_PREFIX: process.env.API_PREFIX || '/api',
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
} as const;

// 验证必要的环境变量
const requiredEnvVars = ['JWT_SECRET'] as const;
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ 缺少必要的环境变量: ${varName}`);
    process.exit(1);
  }
}

// MongoDB 连接警告（非必需，但建议配置）
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ 未设置 MONGODB_URI，将使用默认值: mongodb://127.0.0.1:27017/my_admin');
}

// 生产环境警告
if (env.IS_PROD && env.JWT.SECRET === 'default-secret-do-not-use-in-production') {
  console.error('❌ 生产环境必须设置 JWT_SECRET');
  process.exit(1);
}
