// src/config/env.ts
import { cleanEnv, port, str, num, bool, makeValidator } from 'envalid';

// 自定义验证器：验证逗号分隔的字符串数组
const commaSeparatedArray = makeValidator<string[]>((input) => {
  if (!input) return [];
  return input.split(',').map((item) => item.trim()).filter(Boolean);
});

// 自定义验证器：验证MongoDB连接字符串
const mongoUriValidator = makeValidator<string>((input) => {
  if (!input) {
    throw new Error('MONGODB_URI is required');
  }
  
  // 基本的MongoDB URI格式验证
  if (!input.startsWith('mongodb://') && !input.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  
  return input;
});

// 自定义验证器：验证JWT过期时间格式
const jwtExpiresInValidator = makeValidator<string>((input) => {
  const defaultExpiry = '24h';
  if (!input) return defaultExpiry;
  
  // 验证格式：数字+单位（s, m, h, d）
  const regex = /^(\d+)(s|m|h|d)$/;
  if (!regex.test(input)) {
    throw new Error('JWT_EXPIRES_IN must be in format like: 60s, 30m, 24h, 7d');
  }
  
  return input;
});

// 使用envalid进行严格的类型验证和转换
export const env = cleanEnv(process.env, {
  // 服务器配置
  PORT: port({ default: 3000, desc: '服务器端口号' }),
  NODE_ENV: str({ 
    choices: ['development', 'production', 'test'], 
    default: 'development',
    desc: '运行环境'
  }),
  
  // MongoDB配置 - 生产环境必须，开发环境有默认值
  MONGODB_URI: mongoUriValidator({
    default: process.env.NODE_ENV === 'production' ? undefined : 'mongodb://127.0.0.1:27017/my_admin',
    desc: 'MongoDB连接字符串'
  }),
  MONGODB_DB_NAME: str({ 
    default: 'my_admin',
    desc: 'MongoDB数据库名称'
  }),
  
  // JWT配置
  JWT_SECRET: str({ 
    desc: 'JWT签名密钥，必须设置',
    example: 'your-super-secret-jwt-key-change-this-in-production'
  }),
  JWT_EXPIRES_IN: jwtExpiresInValidator({
    default: '24h',
    desc: 'JWT过期时间，格式如: 60s, 30m, 24h, 7d'
  }),
  
  // API配置
  API_PREFIX: str({ 
    default: '/api',
    desc: 'API前缀'
  }),
  CORS_ORIGIN: commaSeparatedArray({
    default: ['http://localhost:3001'],
    desc: 'CORS允许的源，逗号分隔'
  }),
  
  // 速率限制配置
  RATE_LIMIT_WINDOW_MS: num({ 
    default: 900000, // 15分钟
    desc: '速率限制窗口时间（毫秒）'
  }),
  RATE_LIMIT_MAX: num({ 
    default: 100,
    desc: '速率限制最大请求数'
  }),
  LOGIN_LIMIT_WINDOW_MS: num({ 
    default: 900000, // 15分钟
    desc: '登录速率限制窗口时间（毫秒）'
  }),
  LOGIN_LIMIT_MAX: num({ 
    default: 5,
    desc: '登录速率限制最大请求数'
  }),
  REGISTER_LIMIT_WINDOW_MS: num({ 
    default: 3600000, // 1小时
    desc: '注册速率限制窗口时间（毫秒）'
  }),
  REGISTER_LIMIT_MAX: num({ 
    default: 3,
    desc: '注册速率限制最大请求数'
  }),
  
  // PostgreSQL配置（保留原有，可选）
  DB_HOST: str({ 
    default: 'localhost',
    desc: 'PostgreSQL主机地址'
  }),
  DB_PORT: port({ 
    default: 5432,
    desc: 'PostgreSQL端口'
  }),
  DB_NAME: str({ 
    default: 'my_admin',
    desc: 'PostgreSQL数据库名称'
  }),
  DB_USER: str({ 
    default: 'postgres',
    desc: 'PostgreSQL用户名'
  }),
  DB_PASSWORD: str({ 
    default: '',
    desc: 'PostgreSQL密码'
  }),
  
  // 日志配置
  LOG_LEVEL: str({ 
    choices: ['error', 'warn', 'info', 'debug'],
    default: 'info',
    desc: '日志级别'
  }),
  LOG_TO_FILE: bool({ 
    default: false,
    desc: '是否将日志输出到文件'
  }),
});

// 导出计算属性，保持与原有代码兼容
export const computedEnv = {
  // 服务器
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  IS_DEV: env.NODE_ENV === 'development',
  IS_PROD: env.NODE_ENV === 'production',
  
  // PostgreSQL配置（保留原有）
  DB: {
    HOST: env.DB_HOST,
    PORT: env.DB_PORT,
    NAME: env.DB_NAME,
    USER: env.DB_USER,
    PASSWORD: env.DB_PASSWORD,
    get URL(): string {
      return `postgresql://${this.USER}:${this.PASSWORD}@${this.HOST}:${this.PORT}/${this.NAME}`;
    },
  },
  
  // MongoDB配置
  MONGODB: {
    URI: env.MONGODB_URI,
    DB_NAME: env.MONGODB_DB_NAME,
    OPTIONS: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
    get URL(): string {
      return this.URI;
    },
  },
  
  // JWT
  JWT: {
    SECRET: env.JWT_SECRET,
    EXPIRES_IN: env.JWT_EXPIRES_IN,
  },
  
  // API
  API_PREFIX: env.API_PREFIX,
  CORS_ORIGIN: env.CORS_ORIGIN,
  RATE_LIMIT: {
    WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
    MAX: env.RATE_LIMIT_MAX,
    LOGIN: {
      WINDOW_MS: env.LOGIN_LIMIT_WINDOW_MS,
      MAX: env.LOGIN_LIMIT_MAX,
    },
    REGISTER: {
      WINDOW_MS: env.REGISTER_LIMIT_WINDOW_MS,
      MAX: env.REGISTER_LIMIT_MAX,
    },
  },
  
  // 日志
  LOG_LEVEL: env.LOG_LEVEL,
  LOG_TO_FILE: env.LOG_TO_FILE,
} as const;

// 为了向后兼容，同时导出env和computedEnv
export default computedEnv;
