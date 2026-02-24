// src/config/env.ts
// import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // 加载环境变量
// dotenv.config({
//   path: path.resolve(__dirname, '../../.env'),
// });
// 环境变量工具对象
export const env = {
  // 服务器
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  // 数据库
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

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'default-secret-do-not-use-in-production',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
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

// 生产环境警告
if (env.IS_PROD && env.JWT.SECRET === 'default-secret-do-not-use-in-production') {
  console.error('❌ 生产环境必须设置 JWT_SECRET');
  process.exit(1);
}
