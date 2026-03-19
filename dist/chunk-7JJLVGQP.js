// src/config/mongodb.ts
import chalk from "chalk";
import mongoose from "mongoose";

// src/config/env.ts
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var env = {
  // 服务器
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  IS_DEV: process.env.NODE_ENV === "development",
  IS_PROD: process.env.NODE_ENV === "production",
  // PostgreSQL 配置（保留原有）
  DB: {
    HOST: process.env.DB_HOST || "localhost",
    PORT: parseInt(process.env.DB_PORT || "5432", 10),
    NAME: process.env.DB_NAME || "my_admin",
    USER: process.env.DB_USER || "postgres",
    PASSWORD: process.env.DB_PASSWORD || "",
    get URL() {
      return `postgresql://${this.USER}:${this.PASSWORD}@${this.HOST}:${this.PORT}/${this.NAME}`;
    }
  },
  // MongoDB 配置（新增）
  MONGODB: {
    URI: process.env.MONGO_URL || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/my_admin",
    DB_NAME: process.env.MONGODB_DB_NAME || "my_admin",
    // 连接选项
    OPTIONS: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5e3,
      socketTimeoutMS: 45e3
    },
    // 获取完整的连接字符串（如果需要）
    get URL() {
      return this.URI;
    }
  },
  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || "default-secret-do-not-use-in-production",
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h"
  },
  // API
  API_PREFIX: process.env.API_PREFIX || "/api",
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3001"],
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    LOGIN: {
      WINDOW_MS: parseInt(process.env.LOGIN_LIMIT_WINDOW_MS || "900000", 10),
      MAX: parseInt(process.env.LOGIN_LIMIT_MAX || "5", 10)
    },
    REGISTER: {
      WINDOW_MS: parseInt(process.env.REGISTER_LIMIT_WINDOW_MS || "3600000", 10),
      MAX: parseInt(process.env.REGISTER_LIMIT_MAX || "3", 10)
    }
  }
};
var requiredEnvVars = ["JWT_SECRET"];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`\u274C \u7F3A\u5C11\u5FC5\u8981\u7684\u73AF\u5883\u53D8\u91CF: ${varName}`);
    process.exit(1);
  }
}
if (!process.env.MONGODB_URI) {
  console.warn("\u26A0\uFE0F \u672A\u8BBE\u7F6E MONGODB_URI\uFF0C\u5C06\u4F7F\u7528\u9ED8\u8BA4\u503C: mongodb://127.0.0.1:27017/my_admin");
}
if (env.IS_PROD && env.JWT.SECRET === "default-secret-do-not-use-in-production") {
  console.error("\u274C \u751F\u4EA7\u73AF\u5883\u5FC5\u987B\u8BBE\u7F6E JWT_SECRET");
  process.exit(1);
}

// src/config/mongodb.ts
var MongoDBConnection = class _MongoDBConnection {
  // 静态私有实例，存储唯一的连接对象
  static instance;
  // 连接状态标志，true表示已连接，false表示未连接
  isConnected = false;
  /**
   * 私有构造函数，防止外部通过 new 创建实例
   * 这是单例模式的核心
   */
  constructor() {
  }
  /**
   * 获取单例实例的静态方法
   * 如果实例不存在，则创建新实例；否则返回已有实例
   */
  static getInstance() {
    if (!_MongoDBConnection.instance) {
      _MongoDBConnection.instance = new _MongoDBConnection();
    }
    return _MongoDBConnection.instance;
  }
  /**
   * 连接 MongoDB 数据库
   * 1. 先检查是否已经连接，避免重复连接
   * 2. 使用 env 中的配置进行连接
   * 3. 连接成功后设置事件监听器
   * 4. 生产环境连接失败时退出进程
   */
  async connect() {
    if (this.isConnected) {
      console.log(chalk.yellow("\u26A0\uFE0F MongoDB \u5DF2\u7ECF\u8FDE\u63A5"));
      return;
    }
    try {
      const conn = await mongoose.connect(env.MONGODB.URI, {
        dbName: env.MONGODB.DB_NAME,
        ...env.MONGODB.OPTIONS
      });
      this.isConnected = true;
      console.log(chalk.green("\u2705 MongoDB \u8FDE\u63A5\u6210\u529F:"), chalk.cyan(conn.connection.host));
      this.setupEventListeners();
    } catch (error) {
      console.error(chalk.red("\u274C MongoDB \u8FDE\u63A5\u5931\u8D25:"), error);
      if (env.IS_PROD) {
        process.exit(1);
      }
      throw error;
    }
  }
  /**
   * 设置 MongoDB 连接的事件监听器
   * 监听：错误、断开、重连等事件
   * 同时设置进程退出时的优雅关闭
   */
  setupEventListeners() {
    mongoose.connection.on("error", (err) => {
      console.error(chalk.red("\u274C MongoDB \u8FD0\u884C\u65F6\u9519\u8BEF:"), err);
      this.isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.log(chalk.yellow("\u26A0\uFE0F MongoDB \u8FDE\u63A5\u65AD\u5F00"));
      this.isConnected = false;
    });
    mongoose.connection.on("reconnected", () => {
      console.log(chalk.green("\u{1F504} MongoDB \u91CD\u65B0\u8FDE\u63A5\u6210\u529F"));
      this.isConnected = true;
    });
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log(chalk.yellow("\u26A0\uFE0F MongoDB \u8FDE\u63A5\u5DF2\u5173\u95ED"));
      process.exit(0);
    });
  }
  /**
   * 手动断开数据库连接
   * 用于需要主动关闭连接的场景
   * 例如：测试用例执行完毕、应用关闭等
   */
  async disconnect() {
    if (!this.isConnected) return;
    await mongoose.connection.close();
    this.isConnected = false;
    console.log(chalk.yellow("\u26A0\uFE0F MongoDB \u8FDE\u63A5\u5DF2\u624B\u52A8\u5173\u95ED"));
  }
  /**
   * 获取当前连接状态
   * 用于其他地方需要判断数据库连接状态时
   * @returns boolean - true: 已连接, false: 未连接
   */
  getConnectionStatus() {
    return this.isConnected;
  }
};
var mongoDB = MongoDBConnection.getInstance();
var connectMongoDB = () => mongoDB.connect();

export {
  env,
  mongoDB,
  connectMongoDB
};
