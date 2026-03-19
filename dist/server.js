#!/usr/bin/env node
import {
  connectMongoDB,
  env
} from "./chunk-7JJLVGQP.js";
import {
  UserModel
} from "./chunk-UQDGERUH.js";
import {
  UserRoleModel
} from "./chunk-I5D46LCX.js";

// src/server.ts
import chalk2 from "chalk";
import debugLib from "debug";
import http from "http";

// src/app.ts
import cookieParser from "cookie-parser";
import cors from "cors";
import express8 from "express";
import path2, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/middlewares/logger.ts
var filterSensitiveData = (data) => {
  if (!data) return data;
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => filterSensitiveData(item));
    }
    const filtered = {};
    for (const [key, value] of Object.entries(data)) {
      if (["password", "oldPassword", "newPassword", "confirmPassword", "token", "refreshToken", "authorization"].includes(key.toLowerCase())) {
        filtered[key] = "******";
      } else {
        filtered[key] = filterSensitiveData(value);
      }
    }
    return filtered;
  }
  return data;
};
var loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, body: body6, query: query2, ip } = req;
  const filteredBody = filterSensitiveData(body6);
  const filteredQuery = filterSensitiveData(query2);
  logger.info(`\u{1F4E5} [${method}] ${url} \u8BF7\u6C42`, {
    ip,
    body: method === "POST" || method === "PUT" || method === "PATCH" ? filteredBody : "\u65E0\u8BF7\u6C42\u4F53",
    query: Object.keys(filteredQuery).length > 0 ? filteredQuery : "\u65E0\u67E5\u8BE2\u53C2\u6570"
  });
  res.on("finish", () => {
    const { statusCode } = res;
    const duration = Date.now() - startTime;
    const logData = {
      statusCode,
      duration: `${duration}ms`
    };
    if (statusCode >= 200 && statusCode < 300) {
      logger.success(`\u{1F4E4} [${method}] ${url} \u54CD\u5E94\u6210\u529F`, logData);
    } else if (statusCode >= 300 && statusCode < 400) {
      logger.info(`\u21AA\uFE0F [${method}] ${url} \u91CD\u5B9A\u5411`, logData);
    } else if (statusCode >= 400 && statusCode < 500) {
      logger.warn(`\u26A0\uFE0F [${method}] ${url} \u5BA2\u6237\u7AEF\u9519\u8BEF`, logData);
    } else {
      logger.error(`\u274C [${method}] ${url} \u670D\u52A1\u5668\u9519\u8BEF`, logData);
    }
  });
  next();
};
var logger_default = loggerMiddleware;

// src/utils/captcha.ts
import svgCaptcha from "svg-captcha";
import { v4 as uuidv4 } from "uuid";
var captchaStore = /* @__PURE__ */ new Map();
function cleanExpiredCaptchas(force = false) {
  const now = Date.now();
  let expiredCount = 0;
  const totalCount = captchaStore.size;
  for (const [key, value] of captchaStore.entries()) {
    if (value.expires < now) {
      captchaStore.delete(key);
      expiredCount++;
    }
  }
  if (expiredCount > 0 || force) {
    console.log(`\u{1F9F9} [\u9A8C\u8BC1\u7801\u6E05\u7406] \u5220\u9664\u4E86 ${expiredCount}/${totalCount} \u4E2A\u8FC7\u671F\u9A8C\u8BC1\u7801\uFF0C\u5269\u4F59 ${captchaStore.size} \u4E2A`);
  }
  return expiredCount;
}
function clearAllCaptchas() {
  const count = captchaStore.size;
  captchaStore.clear();
  console.log(`\u{1F9F9} [\u9A8C\u8BC1\u7801\u6E05\u7406] \u5F3A\u5236\u6E05\u7A7A\u6240\u6709\u9A8C\u8BC1\u7801\uFF0C\u5171\u5220\u9664 ${count} \u4E2A`);
  return count;
}
function getCaptchaStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;
  for (const value of captchaStore.values()) {
    if (value.expires > now) {
      active++;
    } else {
      expired++;
    }
  }
  return {
    total: captchaStore.size,
    active,
    expired,
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
  };
}
function startCaptchaCleaner(intervalMinutes = 5) {
  console.log(`\u23F0 \u9A8C\u8BC1\u7801\u6E05\u7406\u5B9A\u65F6\u4EFB\u52A1\u5DF2\u542F\u52A8\uFF0C\u95F4\u9694 ${intervalMinutes} \u5206\u949F`);
  cleanExpiredCaptchas();
  const intervalId = setInterval(
    () => {
      const stats = getCaptchaStats();
      console.log(`\u{1F4CA} [\u9A8C\u8BC1\u7801\u7EDF\u8BA1] \u603B\u6570:${stats.total}, \u6709\u6548:${stats.active}, \u8FC7\u671F:${stats.expired}, \u5185\u5B58:${stats.memory}`);
      const cleaned = cleanExpiredCaptchas();
      if (stats.expired > 100) {
        console.warn(`\u26A0\uFE0F \u8FC7\u671F\u9A8C\u8BC1\u7801\u5806\u79EF\u8F83\u591A(${stats.expired}\u4E2A)\uFF0C\u5EFA\u8BAE\u68C0\u67E5\u524D\u7AEF\u5237\u65B0\u673A\u5236`);
      }
    },
    intervalMinutes * 60 * 1e3
  );
  return {
    stop: () => clearInterval(intervalId),
    clean: cleanExpiredCaptchas,
    clearAll: clearAllCaptchas,
    stats: getCaptchaStats
  };
}
var CaptchaUtil = class {
  /**
   * 生成字符验证码
   */
  static generateCharCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: "0o1i",
      noise: 2,
      color: true,
      background: "#f0f0f0",
      width: 120,
      height: 40
    });
    const uuid = uuidv4();
    const now = Date.now();
    captchaStore.set(uuid, {
      value: captcha.text.toLowerCase(),
      expires: now + 5 * 60 * 1e3,
      // 5分钟过期
      createdAt: now
    });
    return {
      uuid,
      image: captcha.data
    };
  }
  /**
   * 生成数学验证码
   */
  static generateMathCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ["+", "-", "*"];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const expression = `${num1}${operator}${num2}=?`;
    let result;
    switch (operator) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
      case "*":
        result = num1 * num2;
        break;
      default:
        result = num1 + num2;
    }
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: "0o1i",
      noise: 2,
      color: true,
      background: "#f0f0f0",
      width: 120,
      height: 40,
      fontSize: 48
    });
    const uuid = uuidv4();
    const now = Date.now();
    captchaStore.set(uuid, {
      value: result.toString(),
      expires: now + 5 * 60 * 1e3,
      createdAt: now
    });
    return {
      uuid,
      image: captcha.data,
      expression
    };
  }
  /**
   * 验证验证码
   */
  static verify(uuid, code) {
    const captcha = captchaStore.get(uuid);
    if (!captcha) return false;
    if (captcha.expires < Date.now()) {
      captchaStore.delete(uuid);
      return false;
    }
    const isValid = captcha.value === code.toLowerCase().trim();
    if (isValid) {
      captchaStore.delete(uuid);
    }
    return isValid;
  }
  /**
   * 主动删除验证码
   */
  static remove(uuid) {
    return captchaStore.delete(uuid);
  }
  /**
   * 获取统计信息
   */
  static getStats() {
    return getCaptchaStats();
  }
  /**
   * 手动触发清理
   */
  static cleanExpired() {
    return cleanExpiredCaptchas(true);
  }
};
if (process.env.NODE_ENV !== "test") {
  const cleaner = startCaptchaCleaner(5);
  global.__captchaCleaner__ = cleaner;
}

// src/utils/rateLimiter.ts
import { rateLimit } from "express-rate-limit";

// src/utils/logger.ts
import chalk from "chalk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var SimpleLogger = class {
  logDir;
  todayLogFile;
  maxAgeDays = 7;
  // 保留7天
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
    this.ensureLogDir();
    this.todayLogFile = this.getTodayLogFile();
    this.cleanOldLogs();
  }
  // 确保日志目录存在
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }
  // 获取今天的日志文件名
  getTodayLogFile() {
    const date = /* @__PURE__ */ new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return path.join(this.logDir, `${year}-${month}-${day}.log`);
  }
  /**
   * 清理超过7天的日志文件
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = this.maxAgeDays * 24 * 60 * 60 * 1e3;
      files.forEach((file) => {
        if (!file.endsWith(".log")) return;
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          console.log(chalk.gray(`\u{1F9F9} \u6E05\u7406\u8FC7\u671F\u65E5\u5FD7: ${file}`));
        }
      });
    } catch (error) {
      console.error(chalk.yellow("\u26A0\uFE0F \u6E05\u7406\u65E7\u65E5\u5FD7\u5931\u8D25:"), error.message);
    }
  }
  /**
   * 检查并清理（可以在每次写入时调用，但为了性能，可以每天只检查一次）
   */
  checkAndCleanIfNeeded() {
    try {
      const today = this.getTodayLogFile();
      const lastCleanFile = path.join(this.logDir, ".lastclean");
      let lastClean = 0;
      if (fs.existsSync(lastCleanFile)) {
        lastClean = parseInt(fs.readFileSync(lastCleanFile, "utf-8")) || 0;
      }
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1e3;
      if (now - lastClean > oneDay) {
        this.cleanOldLogs();
        fs.writeFileSync(lastCleanFile, now.toString());
      }
    } catch (error) {
    }
  }
  // 写入文件
  writeToFile(level, message, data) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    const logLine = `[${timestamp}] ${level} - ${message}${dataStr}
`;
    try {
      fs.appendFileSync(this.todayLogFile, logLine);
    } catch (error) {
      console.error("\u5199\u5165\u65E5\u5FD7\u6587\u4EF6\u5931\u8D25:", error);
    }
  }
  // 信息日志（蓝色）
  info(message, data) {
    console.log(chalk.blue(`\u2139\uFE0F ${message}`), data ? chalk.gray(JSON.stringify(data)) : "");
    this.writeToFile("INFO", message, data);
  }
  // 成功日志（绿色）
  success(message, data) {
    console.log(chalk.green(`\u2705 ${message}`), data ? chalk.gray(JSON.stringify(data)) : "");
    this.writeToFile("SUCCESS", message, data);
  }
  // 警告日志（黄色）
  warn(message, data) {
    console.log(chalk.yellow(`\u26A0\uFE0F ${message}`), data ? chalk.gray(JSON.stringify(data)) : "");
    this.writeToFile("WARN", message, data);
  }
  // 错误日志（红色）
  error(message, error) {
    console.error(chalk.red(`\u274C ${message}`));
    if (error) {
      console.error(chalk.red(error.stack || error));
    }
    this.writeToFile("ERROR", message, { error: error?.message || error });
  }
  // 调试日志（灰色，只在开发环境输出）
  debug(message, data) {
    if (process.env.NODE_ENV === "development") {
      console.log(chalk.gray(`\u{1F50D} ${message}`), data ? chalk.gray(JSON.stringify(data)) : "");
    }
    this.writeToFile("DEBUG", message, data);
  }
  /**
   * 手动触发清理
   * 可以在需要时调用
   */
  manualClean() {
    this.cleanOldLogs();
  }
  /**
   * 设置保留天数
   */
  setMaxAge(days) {
    this.maxAgeDays = days;
    this.cleanOldLogs();
  }
};
var logger2 = new SimpleLogger();

// src/utils/rateLimiter.ts
var RateLimiterUtil = class _RateLimiterUtil {
  /**
   * 创建限流器
   */
  static create(options) {
    const { windowMs, max, message, skipSuccessful = false } = options;
    return rateLimit({
      windowMs,
      limit: max,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      skipSuccessfulRequests: skipSuccessful,
      message: { code: 429, msg: message },
      statusCode: 429,
      handler: (req, res) => {
        logger2.warn(`\u9650\u6D41\u89E6\u53D1: ${req.ip} - ${req.path}`);
        res.status(429).json({ code: 429, msg: message });
      }
    });
  }
  // 预定义限流器
  static general = _RateLimiterUtil.create({
    windowMs: 15 * 60 * 1e3,
    max: 100,
    message: "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41"
  });
  static login = _RateLimiterUtil.create({
    windowMs: 15 * 60 * 1e3,
    max: 5,
    message: "\u767B\u5F55\u5C1D\u8BD5\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF715\u5206\u949F\u540E\u518D\u8BD5",
    skipSuccessful: true
  });
  static register = _RateLimiterUtil.create({
    windowMs: 60 * 60 * 1e3,
    max: 3,
    message: "\u6CE8\u518C\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF71\u5C0F\u65F6\u540E\u518D\u8BD5"
  });
};

// src/config/security.ts
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss";
var SecurityConfig = class {
  // /**
  //  * 1. CORS 配置 暂时没有前端先不管
  //  */
  // static corsOptions = {
  //   origin: env.CORS_ORIGIN || '*', // 允许的域名
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  //   exposedHeaders: ['Content-Range', 'X-Content-Range'],
  //   credentials: true, // 允许携带cookie
  //   maxAge: 86400, // 预检请求缓存时间（秒）
  //   optionsSuccessStatus: 200,
  // };
  /**
   * 2. Helmet 配置（安全HTTP头）
   */
  static helmetConfig = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  // /**
  //  * 3. 全局限流配置
  //  */
  // static globalLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15分钟
  //   max: 100, // 每个IP最多100个请求
  //   message: {
  //     code: 429,
  //     msg: '请求过于频繁，请稍后再试',
  //   },
  //   standardHeaders: true,
  //   legacyHeaders: false,
  //   skip: (req) => req.path === '/health' || req.path === '/favicon.ico', // 跳过健康检查
  // });
  // /**
  //  * 4. 登录限流（严格）
  //  */
  // static loginLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000,
  //   max: 5,
  //   message: {
  //     code: 429,
  //     msg: '登录尝试次数过多，请15分钟后再试',
  //   },
  //   skipSuccessfulRequests: true,
  // });
  // /**
  //  * 5. 注册限流
  //  */
  // static registerLimiter = rateLimit({
  //   windowMs: 60 * 60 * 1000,
  //   max: 3,
  //   message: {
  //     code: 429,
  //     msg: '注册过于频繁，请1小时后再试',
  //   },
  // });
  /**
   * 6. XSS过滤中间件
   */
  static xssMiddleware = (req, res, next) => {
    const filterXSS = (input) => {
      if (typeof input === "string") {
        return xss(input, {
          whiteList: {},
          // 不允许任何HTML标签
          stripIgnoreTag: true,
          stripIgnoreTagBody: ["script", "style"]
        });
      }
      if (Array.isArray(input)) {
        return input.map((item) => filterXSS(item));
      }
      if (input && typeof input === "object") {
        const filtered = {};
        for (const key in input) {
          filtered[key] = filterXSS(input[key]);
        }
        return filtered;
      }
      return input;
    };
    if (req.body) req.body = filterXSS(req.body);
    if (req.query) req.query = filterXSS(req.query);
    if (req.params) req.params = filterXSS(req.params);
    next();
  };
  /**
   * 7. 参数过滤（防止NoSQL注入）
   */
  static sanitizeMiddleware = mongoSanitize({
    allowDots: true,
    replaceWith: "_"
  });
  /**
   * 8. 防点击劫持
   */
  static frameguard = (req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    next();
  };
  /**
   * 9. 禁用服务器信息
   */
  static hideServerInfo = (req, res, next) => {
    res.removeHeader("X-Powered-By");
    next();
  };
};

// src/routes/index.ts
import express7 from "express";

// src/routes/modules/captcha/captcha.ts
import { Router } from "express";

// src/controller/modules/captcha/captcha.ts
var getCaptcha = async (req, res) => {
  try {
    const { uuid } = req.query;
    if (uuid && typeof uuid === "string") {
      console.log(`\u4E3B\u52A8\u5220\u9664\u65E7\u9A8C\u8BC1\u7801: ${uuid}`);
      CaptchaUtil.remove(uuid);
    }
    const result = CaptchaUtil.generateCharCaptcha();
    res.json({
      code: 200,
      msg: "success",
      data: {
        uuid: result.uuid,
        image: result.image,
        // SVG格式
        ...result.expression && { expression: result.expression }
        // 数学表达式
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: "\u9A8C\u8BC1\u7801\u751F\u6210\u5931\u8D25" });
  }
};
var verifyCaptcha = async (req, res) => {
  const { uuid, code } = req.body;
  const isValid = CaptchaUtil.verify(uuid, code);
  res.json({
    code: isValid ? 200 : 400,
    msg: isValid ? "\u9A8C\u8BC1\u6210\u529F" : "\u9A8C\u8BC1\u7801\u9519\u8BEF"
  });
};

// src/routes/modules/captcha/captcha.ts
var router = Router();
router.get("/getCaptcha", getCaptcha);
router.post("/verify", verifyCaptcha);
var captcha_default = router;

// src/routes/modules/dept/dept.ts
import express from "express";

// src/controller/modules/dept/deptController.ts
import { Types } from "mongoose";

// src/models/dept/dept.ts
import mongoose, { Schema } from "mongoose";
var deptSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "\u90E8\u95E8\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"],
      trim: true,
      maxlength: [50, "\u90E8\u95E8\u540D\u79F0\u4E0D\u80FD\u8D85\u8FC750"]
    },
    code: {
      type: String,
      required: [true, "\u90E8\u95E8\u7F16\u7801\u4E0D\u80FD\u4E3A\u7A7A"],
      unique: true,
      trim: true,
      maxlength: [30, "\u90E8\u95E8\u7F16\u7801\u4E0D\u80FD\u8D85\u8FC730"]
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Dept",
      default: null
    },
    ancestors: {
      type: String,
      default: ""
    },
    orderNum: {
      type: Number,
      default: 0
    },
    leader: {
      type: String,
      trim: true,
      maxlength: [20, "\u8D1F\u8D23\u4EBA\u59D3\u540D\u4E0D\u80FD\u8D85\u8FC720"]
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^1[3-9]\d{9}$/.test(v);
        },
        message: "\u624B\u673A\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E"
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E"
      }
    },
    status: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    },
    delFlag: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    }
  },
  {
    timestamps: true,
    // ✅ 添加 toJSON 转换器
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        if (ret.parentId) {
          ret.parentId = ret.parentId.toString();
        }
        return ret;
      }
    },
    // ✅ 添加 toObject 转换器（可选）
    toObject: {
      transform: function(doc, ret) {
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        if (ret.parentId) {
          ret.parentId = ret.parentId.toString();
        }
        return ret;
      }
    }
  }
);
deptSchema.index({ parentId: 1 });
var DeptModel = mongoose.models.Dept ? mongoose.model("Dept") : mongoose.model("Dept", deptSchema);

// src/controller/modules/dept/deptController.ts
var DeptController = class {
  /**
   * 获取部门列表（树形结构）
   */
  async getDeptTree(req, res) {
    try {
      const { status, keyword } = req.query;
      const conditions = { delFlag: "0" };
      if (status !== void 0 && status !== "") {
        conditions.status = status;
      }
      if (keyword) {
        conditions.name = new RegExp(keyword, "i");
      }
      const allDepts = await DeptModel.find(conditions).sort({ orderNum: 1 });
      console.log("\u90E8\u95E8\u6811\u67E5\u8BE2\u6761\u4EF6:", conditions);
      console.log("\u67E5\u8BE2\u5230\u7684\u90E8\u95E8\u6570\u91CF:", allDepts.length);
      allDepts.forEach((dept) => {
        console.log(`- ${dept.name}: id=${dept._id}, parentId=${dept.parentId}, status=${dept.status}, delFlag=${dept.delFlag}`);
      });
      const buildDeptTree = (parentId = null) => {
        const filtered = allDepts.filter((dept) => {
          if (parentId === null) return !dept.parentId;
          return dept.parentId?.toString() === parentId;
        });
        console.log(`\u6784\u5EFA\u90E8\u95E8\u6811: parentId=${parentId}, \u627E\u5230 ${filtered.length} \u4E2A\u90E8\u95E8`);
        return filtered.map((dept) => {
          const children = buildDeptTree(dept._id.toString());
          return {
            ...dept.toObject(),
            children: children.length > 0 ? children : void 0
          };
        });
      };
      const deptTree = buildDeptTree();
      console.log("\u6784\u5EFA\u7684\u90E8\u95E8\u6811:", JSON.stringify(deptTree, null, 2));
      res.json({
        code: 200,
        msg: "success",
        data: deptTree
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u90E8\u95E8\u6811\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取部门详情
   */
  async getDeptDetail(req, res) {
    try {
      const { id } = req.params;
      const dept = await DeptModel.findById(id);
      if (!dept || dept.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u90E8\u95E8\u4E0D\u5B58\u5728" });
      }
      res.json({
        code: 200,
        msg: "success",
        data: dept
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u90E8\u95E8\u8BE6\u60C5\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 创建部门
   */
  async createDept(req, res) {
    try {
      const { name, code, parentId, orderNum, leader, phone, email, status } = req.body;
      const existingDept = await DeptModel.findOne({ code });
      if (existingDept) {
        return res.status(409).json({ code: 409, msg: "\u90E8\u95E8\u7F16\u7801\u5DF2\u5B58\u5728" });
      }
      let ancestors = "";
      if (parentId) {
        const parentDept = await DeptModel.findById(parentId);
        if (!parentDept) {
          return res.status(404).json({ code: 404, msg: "\u7236\u7EA7\u90E8\u95E8\u4E0D\u5B58\u5728" });
        }
        ancestors = parentDept.ancestors ? `${parentDept.ancestors}${parentId},` : `,${parentId},`;
      } else {
        ancestors = ",";
      }
      const dept = await DeptModel.create({
        name,
        code,
        parentId: parentId || null,
        ancestors,
        orderNum: orderNum || 0,
        leader,
        phone,
        email,
        status: status || "0"
      });
      res.status(201).json({
        code: 201,
        msg: "\u521B\u5EFA\u6210\u529F",
        data: dept
      });
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ code: 409, msg: "\u90E8\u95E8\u7F16\u7801\u5DF2\u5B58\u5728" });
      }
      console.error("\u521B\u5EFA\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 更新部门
   */
  async updateDept(req, res) {
    try {
      const { id } = req.params;
      const { name, code, parentId, orderNum, leader, phone, email, status } = req.body;
      const deptId = id;
      const parentIdStr = parentId;
      if (!deptId || deptId === "undefined" || deptId === "null") {
        return res.status(400).json({ code: 400, msg: "\u90E8\u95E8ID\u65E0\u6548" });
      }
      const dept = await DeptModel.findById(deptId);
      if (!dept || dept.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u90E8\u95E8\u4E0D\u5B58\u5728" });
      }
      if (code && code !== dept.code) {
        const existingDept = await DeptModel.findOne({ code, _id: { $ne: new Types.ObjectId(deptId) } });
        if (existingDept) {
          return res.status(409).json({ code: 409, msg: "\u90E8\u95E8\u7F16\u7801\u5DF2\u5B58\u5728" });
        }
      }
      if (parentIdStr && parentIdStr !== dept.parentId?.toString()) {
        if (parentIdStr === deptId) {
          return res.status(400).json({ code: 400, msg: "\u4E0D\u80FD\u5C06\u90E8\u95E8\u8BBE\u4E3A\u81EA\u5DF1\u7684\u7236\u7EA7" });
        }
        const checkCircular = async (currentDeptId, targetId) => {
          const children = await DeptModel.find({ parentId: currentDeptId, delFlag: "0" });
          for (const child of children) {
            if (child._id.toString() === targetId) {
              return true;
            }
            if (await checkCircular(child._id.toString(), targetId)) {
              return true;
            }
          }
          return false;
        };
        if (await checkCircular(deptId, parentIdStr)) {
          return res.status(400).json({ code: 400, msg: "\u4E0D\u80FD\u5C06\u7236\u7EA7\u90E8\u95E8\u8BBE\u4E3A\u81EA\u5DF1\u7684\u5B50\u90E8\u95E8" });
        }
        const parentDept = await DeptModel.findById(parentIdStr);
        if (!parentDept) {
          return res.status(404).json({ code: 404, msg: "\u7236\u7EA7\u90E8\u95E8\u4E0D\u5B58\u5728" });
        }
        dept.ancestors = parentDept.ancestors ? `${parentDept.ancestors}${parentIdStr},` : `,${parentIdStr},`;
        dept.parentId = new Types.ObjectId(parentIdStr);
      }
      if (name) dept.name = name;
      if (code) dept.code = code;
      if (orderNum !== void 0) dept.orderNum = orderNum;
      if (leader !== void 0) dept.leader = leader;
      if (phone !== void 0) dept.phone = phone;
      if (email !== void 0) dept.email = email;
      if (status !== void 0) dept.status = status;
      await dept.save();
      await this.updateChildrenAncestors(deptId, dept.ancestors);
      res.json({
        code: 200,
        msg: "\u66F4\u65B0\u6210\u529F",
        data: dept
      });
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ code: 409, msg: "\u90E8\u95E8\u7F16\u7801\u5DF2\u5B58\u5728" });
      }
      console.error("\u66F4\u65B0\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 递归更新子部门的祖先路径
   */
  async updateChildrenAncestors(parentId, parentAncestors) {
    const children = await DeptModel.find({ parentId, delFlag: "0" });
    for (const child of children) {
      const newAncestors = `${parentAncestors}${parentId},`;
      child.ancestors = newAncestors;
      await child.save();
      await this.updateChildrenAncestors(child._id.toString(), newAncestors);
    }
  }
  /**
   * 删除部门
   */
  async deleteDept(req, res) {
    try {
      const { id } = req.params;
      const dept = await DeptModel.findById(id);
      if (!dept || dept.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u90E8\u95E8\u4E0D\u5B58\u5728" });
      }
      const childCount = await DeptModel.countDocuments({ parentId: id, delFlag: "0" });
      if (childCount > 0) {
        return res.status(400).json({ code: 400, msg: "\u8BE5\u90E8\u95E8\u4E0B\u5B58\u5728\u5B50\u90E8\u95E8\uFF0C\u65E0\u6CD5\u5220\u9664" });
      }
      const { UserModel: UserModel2 } = await import("./users-2JVZYNQY.js");
      const userCount = await UserModel2.countDocuments({ deptId: id });
      if (userCount > 0) {
        return res.status(400).json({ code: 400, msg: "\u8BE5\u90E8\u95E8\u4E0B\u5B58\u5728\u7528\u6237\uFF0C\u65E0\u6CD5\u5220\u9664" });
      }
      dept.delFlag = "1";
      await dept.save();
      res.json({
        code: 200,
        msg: "\u5220\u9664\u6210\u529F"
      });
    } catch (error) {
      console.error("\u5220\u9664\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取所有部门（用于下拉选择）
   */
  async getAllDepts(req, res) {
    try {
      const depts = await DeptModel.find({ delFlag: "0", status: "0" }).select("id name code parentId").sort({ orderNum: 1 });
      const buildSimpleTree = (parentId = null) => {
        return depts.filter((dept) => {
          if (parentId === null) return !dept.parentId;
          return dept.parentId?.toString() === parentId;
        }).map((dept) => {
          const children = buildSimpleTree(dept._id.toString());
          return {
            id: dept._id.toString(),
            label: dept.name,
            children: children.length > 0 ? children : void 0
          };
        });
      };
      const deptTree = buildSimpleTree();
      res.json({
        code: 200,
        msg: "success",
        data: deptTree
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u6240\u6709\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取部门用户数统计
   */
  async getDeptUserStats(req, res) {
    try {
      const { UserModel: UserModel2 } = await import("./users-2JVZYNQY.js");
      const depts = await DeptModel.find({ delFlag: "0" }).select("id name");
      const stats = await Promise.all(
        depts.map(async (dept) => {
          const userCount = await UserModel2.countDocuments({ deptId: dept._id });
          return {
            deptId: dept._id.toString(),
            deptName: dept.name,
            userCount
          };
        })
      );
      res.json({
        code: 200,
        msg: "success",
        data: stats
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u90E8\u95E8\u7528\u6237\u7EDF\u8BA1\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
};
var deptController_default = new DeptController();

// src/models/menu/menu.ts
import mongoose2, { Schema as Schema2 } from "mongoose";
var menuSchema = new Schema2(
  {
    pid: {
      type: Schema2.Types.ObjectId,
      ref: "Router",
      // 自关联
      default: null,
      index: true
      // 添加索引
    },
    name: {
      type: String,
      required: [true, "\u8DEF\u7531\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"],
      unique: true,
      // 路由名称唯一
      trim: true,
      match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, "\u8DEF\u7531\u540D\u79F0\u5FC5\u987B\u4EE5\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\uFF0C\u6570\u5B57\uFF0C\u4E0B\u5212\u7EBF"]
    },
    path: {
      type: String,
      required: [true, "\u8DEF\u7531\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A"],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\/[a-zA-Z0-9_\-/]*$/.test(v);
        },
        message: "\u8DEF\u7531\u8DEF\u5F84\u5FC5\u987B\u4EE5/\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF\u3001\u6A2A\u7EBF\u548C\u659C\u6760"
      }
    },
    component: {
      type: String,
      required: [true, "\u7EC4\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A"],
      trim: true
    },
    title: {
      type: String,
      required: [true, "\u8DEF\u7531\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A"],
      trim: true
    },
    icon: {
      type: String,
      default: ""
    },
    sort: {
      type: Number,
      default: 0,
      min: [0, "\u6392\u5E8F\u503C\u4E0D\u80FD\u5C0F\u4E8E0"]
    },
    type: {
      type: String,
      enum: ["menu", "button", "iframe"],
      default: "menu"
    },
    hidden: {
      type: Boolean,
      default: false
    },
    cache: {
      type: Boolean,
      default: true
    },
    permission: {
      type: String,
      trim: true
      // 说明：按钮类型通常需要权限，菜单根据需要设置
      // 不设required，因为有些菜单不需要权限控制
    },
    external: {
      type: Boolean,
      default: false
    },
    target: {
      type: String,
      enum: ["_blank", "_self"],
      default: "_self"
    }
  },
  {
    timestamps: true,
    // 这会自动添加 createdAt 和 updatedAt 字段
    toJSON: {
      virtuals: true,
      // 启用虚拟字段
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret._id;
        if (doc._id) {
          ret.id = doc._id.toString();
        }
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      // 启用虚拟字段
      transform: function(doc, ret) {
        delete ret.__v;
        delete ret._id;
        if (doc._id) {
          ret.id = doc._id.toString();
        }
        return ret;
      }
    }
  }
);
menuSchema.virtual("children", {
  ref: "menu",
  localField: "_id",
  foreignField: "pid"
});
menuSchema.index({ pid: 1, sort: 1 });
menuSchema.index({ pid: 1, name: 1 }, { unique: true });
menuSchema.statics.getTree = async function(pid = null) {
  const routes = await this.find({ pid }).sort("sort");
  const tree = [];
  for (const route of routes) {
    const item = route.toObject();
    const children = await this.getTree(route._id.toString());
    if (children.length > 0) {
      item.children = children;
    }
    tree.push(item);
  }
  return tree;
};
menuSchema.statics.getFullTree = async function() {
  const allRoutes = await this.find().sort("sort").lean();
  const map = /* @__PURE__ */ new Map();
  const tree = [];
  allRoutes.forEach((route) => {
    const routeId = route._id.toString();
    const routePid = route.pid?.toString() || null;
    const convertedRoute = {
      ...route,
      id: routeId,
      pid: routePid,
      children: []
    };
    delete convertedRoute._id;
    delete convertedRoute.__v;
    map.set(routeId, convertedRoute);
  });
  allRoutes.forEach((route) => {
    const id = route._id.toString();
    const pid = route.pid?.toString();
    if (pid && map.has(pid)) {
      map.get(pid).children.push(map.get(id));
    } else {
      tree.push(map.get(id));
    }
  });
  return tree;
};
var MenuModel = mongoose2.models.menu ? mongoose2.model("Menu") : mongoose2.model("Menu", menuSchema);

// src/models/role/role.ts
import mongoose3, { Schema as Schema3 } from "mongoose";
var roleSchema = new Schema3(
  {
    name: {
      type: String,
      required: [true, "\u89D2\u8272\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A"],
      unique: true,
      trim: true,
      minlength: [2, "\u89D2\u8272\u540D\u79F0\u957F\u5EA6\u4E0D\u80FD\u5C0F\u4E8E2"],
      maxlength: [30, "\u89D2\u8272\u540D\u79F0\u957F\u5EA6\u4E0D\u80FD\u5927\u4E8E30"]
    },
    label: {
      type: String,
      required: [true, "\u89D2\u8272\u6807\u7B7E\u4E0D\u80FD\u4E3A\u7A7A"],
      trim: true
    },
    dataScope: {
      type: String,
      enum: ["1", "2", "3", "4", "5"],
      default: "3"
      // 默认本部门数据权限
    },
    status: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    },
    delFlag: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    },
    remark: {
      type: String,
      maxlength: [200, "\u5907\u6CE8\u4E0D\u80FD\u8D85\u8FC7200\u5B57"]
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      }
    }
  }
);
roleSchema.index({ name: 1 });
var RoleModel = mongoose3.models.Role ? mongoose3.model("Role") : mongoose3.model("Role", roleSchema);

// src/models/roleDept/roleDept.ts
import mongoose4, { Schema as Schema4 } from "mongoose";
var roleDeptSchema = new Schema4(
  {
    roleId: {
      type: Schema4.Types.ObjectId,
      ref: "Role",
      required: true
    },
    deptId: {
      type: Schema4.Types.ObjectId,
      ref: "Dept",
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
roleDeptSchema.index({ roleId: 1, deptId: 1 }, { unique: true });
var RoleDeptModel = mongoose4.models.RoleDept ? mongoose4.model("RoleDept") : mongoose4.model("RoleDept", roleDeptSchema);

// src/models/roleMenu/roleMenu.ts
import mongoose5, { Schema as Schema5 } from "mongoose";
var roleMenuSchema = new Schema5(
  {
    roleId: {
      type: Schema5.Types.ObjectId,
      ref: "Role",
      required: true
    },
    menuId: {
      type: Schema5.Types.ObjectId,
      ref: "Menu",
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
roleMenuSchema.index({ roleId: 1, menuId: 1 }, { unique: true });
var RoleMenuModel = mongoose5.models.RoleMenu ? mongoose5.model("RoleMenu") : mongoose5.model("RoleMenu", roleMenuSchema);

// src/models/test/test.model.ts
import mongoose6, { Schema as Schema6 } from "mongoose";
var textSchema = new Schema6(
  {
    name: {
      type: String,
      required: [true, "\u59D3\u540D\u662F\u5FC5\u586B\u9879"],
      // 必填，自定义错误信息
      trim: true,
      // 自动去除首尾空格
      maxlength: [50, "\u59D3\u540D\u4E0D\u80FD\u8D85\u8FC750\u4E2A\u5B57\u7B26"],
      // 最大长度限制
      minlength: [2, "\u59D3\u540D\u81F3\u5C11\u9700\u89812\u4E2A\u5B57\u7B26"]
      // 最小长度限制
    },
    email: {
      type: String,
      required: [true, "\u90AE\u7BB1\u662F\u5FC5\u586B\u9879"],
      unique: true,
      // 唯一索引，确保邮箱不重复
      lowercase: true,
      // 自动转换为小写
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E"]
      // 正则表达式验证邮箱格式
    },
    age: {
      type: Number,
      min: [0, "\u5E74\u9F84\u4E0D\u80FD\u5C0F\u4E8E0"],
      // 最小值验证
      max: [120, "\u5E74\u9F84\u4E0D\u80FD\u8D85\u8FC7120"],
      // 最大值验证
      validate: {
        validator: (value) => Number.isInteger(value),
        // 验证是否为整数
        message: "\u5E74\u9F84\u5FC5\u987B\u662F\u6574\u6570"
      }
    }
  },
  {
    timestamps: true,
    // 自动添加 createdAt 和 updatedAt 字段
    versionKey: "__v"
    // 版本控制字段，默认为 __v
  }
);
var testModel = mongoose6.model("Test", textSchema);

// src/controller/modules/menu/addMenu.ts
var addMenu = async (req, res) => {
  try {
    const { name, path: path3, component, title, icon, sort, pid, type, hidden, cache, permissions, external, target } = req.body;
    if (!name || !path3 || !component || !title) {
      return res.status(200).json({
        code: 1e3,
        msg: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5\uFF1Aname\u3001path\u3001component\u3001title \u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    const existingRoute = await MenuModel.findOne({ name });
    if (existingRoute) {
      return res.status(200).json({
        code: 1e3,
        msg: "\u8DEF\u7531\u540D\u79F0\u5DF2\u5B58\u5728"
      });
    }
    if (pid) {
      const parentRoute = await MenuModel.findById(pid);
      if (!parentRoute) {
        return res.status(200).json({
          code: 1e3,
          msg: "\u7236\u7EA7\u8DEF\u7531\u4E0D\u5B58\u5728"
        });
      }
    }
    const menuData = {
      name,
      path: path3,
      component,
      title,
      icon: icon || "",
      sort: sort || 0,
      type: type || "menu",
      hidden: hidden || false,
      cache: cache !== void 0 ? cache : true,
      permissions: permissions || [],
      external: external || false,
      target: target || "_self"
    };
    if (pid) {
      menuData.pid = pid;
    } else {
      menuData.pid = null;
    }
    const menu = await MenuModel.create(menuData);
    res.status(200).json({
      code: 200,
      msg: "\u83DC\u5355\u6DFB\u52A0\u6210\u529F",
      data: menu
    });
  } catch (error) {
    if (error.code === 11e3) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        code: 409,
        msg: `${field === "name" ? "\u8DEF\u7531\u540D\u79F0" : field}\u5DF2\u5B58\u5728`
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        code: 400,
        msg: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        errors: messages
      });
    }
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};

// src/controller/modules/menu/delMenu.ts
var delMenu = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: "\u83DC\u5355ID\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    const childrenCount = await MenuModel.countDocuments({ pid: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        code: 400,
        msg: "\u8BF7\u5148\u5220\u9664\u5B50\u83DC\u5355"
      });
    }
    const result = await MenuModel.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: "\u83DC\u5355\u4E0D\u5B58\u5728"
      });
    }
    res.status(200).json({
      code: 200,
      msg: "\u5220\u9664\u6210\u529F"
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};
var findMenu = async (req, res) => {
  try {
    const { type } = req.query;
    let menuTree = await MenuModel.getFullTree();
    if (type) {
      const filterByType = (menus) => {
        return menus.filter((menu) => menu.type === type).map((menu) => ({
          ...menu,
          children: menu.children ? filterByType(menu.children) : []
        })).filter((menu) => menu.children.length > 0 || menu.type === type);
      };
      menuTree = filterByType(menuTree);
    }
    res.status(200).json({
      code: 200,
      msg: "\u83B7\u53D6\u6210\u529F",
      data: menuTree
    });
  } catch (error) {
    logger.error("\u67E5\u8BE2\u83DC\u5355\u5931\u8D25:", error);
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};

// src/controller/modules/menu/updateMenu.ts
var updateMenu = async (req, res) => {
  try {
    const obj = req.body;
    const { name, path: path3, component, title } = req.body;
    if (!name || !path3 || !component || !title) {
      return res.status(200).json({
        code: 1e3,
        msg: "\u7F3A\u5C11\u5FC5\u586B\u5B57\u6BB5\uFF1Aname\u3001path\u3001component\u3001title \u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    if (!obj.id) {
      return res.status(200).json({ code: 1e3, msg: "\u7F3A\u5C11\u5FC5\u8981\u7684id" });
    }
    const { id, ...updateData } = obj;
    if (updateData.pid === "") {
      updateData.pid = null;
    }
    const result = await MenuModel.findByIdAndUpdate(id, updateData);
    if (!result) {
      return res.status(200).json({ code: 1e3, msg: "\u66F4\u65B0\u5931\u8D25" });
    }
    res.status(200).json({ code: 200, msg: "\u66F4\u65B0\u6210\u529F" });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        code: 400,
        msg: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        errors: messages
      });
    }
    console.error("\u66F4\u65B0\u83DC\u5355\u5931\u8D25:", error);
    res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" });
  }
};

// src/controller/modules/menu/menuController.ts
var updateMenuRest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ code: 400, msg: "\u83DC\u5355ID\u65E0\u6548" });
    }
    req.body.id = id;
    return updateMenu(req, res);
  } catch (error) {
    console.error("RESTful\u66F4\u65B0\u83DC\u5355\u5931\u8D25:", error);
    res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
  }
};
var deleteMenuRest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ code: 400, msg: "\u83DC\u5355ID\u65E0\u6548" });
    }
    req.body.id = id;
    return delMenu(req, res);
  } catch (error) {
    console.error("RESTful\u5220\u9664\u83DC\u5355\u5931\u8D25:", error);
    res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
  }
};
var getAllMenus = async (req, res) => {
  try {
    return findMenu(req, res);
  } catch (error) {
    console.error("\u83B7\u53D6\u6240\u6709\u83DC\u5355\u5931\u8D25:", error);
    res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
  }
};
var menuController_default = {
  addMenu,
  updateMenu,
  delMenu,
  findMenu,
  updateMenuRest,
  deleteMenuRest,
  getAllMenus
};

// src/controller/modules/role/roleController.ts
import { Types as Types2 } from "mongoose";
var RoleController = class {
  /**
   * 获取角色列表
   */
  async getRoleList(req, res) {
    try {
      const { page = 1, limit = 10, keyword, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const conditions = {};
      conditions.delFlag = { $ne: "1" };
      if (keyword) {
        conditions.$or = [
          { name: new RegExp(keyword, "i") },
          { label: new RegExp(keyword, "i") }
        ];
      }
      if (status !== void 0 && status !== "") {
        conditions.status = status;
      }
      const total = await RoleModel.countDocuments(conditions);
      const roles = await RoleModel.find(conditions).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
      const formattedRoles = roles.map((role) => ({
        id: role._id.toString(),
        name: role.name,
        label: role.label,
        dataScope: role.dataScope,
        status: role.status,
        remark: role.remark || "",
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));
      res.json({
        code: 200,
        msg: "success",
        data: {
          list: formattedRoles,
          total,
          // 添加total字段到根级别，兼容前端
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u5217\u8868\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色详情
   */
  async getRoleDetail(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      const roleMenus = await RoleMenuModel.find({ roleId: id });
      const menuIds = roleMenus.map((rm) => rm.menuId.toString());
      const roleDepts = await RoleDeptModel.find({ roleId: id });
      const deptIds = roleDepts.map((rd) => rd.deptId.toString());
      res.json({
        code: 200,
        msg: "success",
        data: {
          ...role.toObject(),
          menuIds,
          deptIds
        }
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u8BE6\u60C5\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 创建角色
   */
  async createRole(req, res) {
    try {
      const { name, label, dataScope: dataScope2, status, remark, menuIds, deptIds } = req.body;
      const existingRole = await RoleModel.findOne({ name });
      if (existingRole) {
        return res.status(409).json({ code: 409, msg: "\u89D2\u8272\u540D\u79F0\u5DF2\u5B58\u5728" });
      }
      const role = await RoleModel.create({
        name,
        label,
        dataScope: dataScope2 || "3",
        status: status || "0",
        remark
      });
      if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
        const roleMenuDocs = menuIds.map((menuId) => ({
          roleId: role._id,
          menuId: new Types2.ObjectId(menuId)
        }));
        await RoleMenuModel.insertMany(roleMenuDocs);
      }
      if (deptIds && Array.isArray(deptIds) && deptIds.length > 0 && dataScope2 === "2") {
        const roleDeptDocs = deptIds.map((deptId) => ({
          roleId: role._id,
          deptId: new Types2.ObjectId(deptId)
        }));
        await RoleDeptModel.insertMany(roleDeptDocs);
      }
      res.status(201).json({
        code: 201,
        msg: "\u521B\u5EFA\u6210\u529F",
        data: role
      });
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ code: 409, msg: "\u89D2\u8272\u540D\u79F0\u5DF2\u5B58\u5728" });
      }
      console.error("\u521B\u5EFA\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 更新角色
   */
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, label, dataScope: dataScope2, status, remark, menuIds, deptIds } = req.body;
      const roleId = id;
      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      if (name && name !== role.name) {
        const existingRole = await RoleModel.findOne({ name, _id: { $ne: new Types2.ObjectId(roleId) } });
        if (existingRole) {
          return res.status(409).json({ code: 409, msg: "\u89D2\u8272\u540D\u79F0\u5DF2\u5B58\u5728" });
        }
      }
      const updateData = {};
      if (name) updateData.name = name;
      if (label) updateData.label = label;
      if (dataScope2) updateData.dataScope = dataScope2;
      if (status !== void 0) updateData.status = status;
      if (remark !== void 0) updateData.remark = remark;
      const updatedRole = await RoleModel.findByIdAndUpdate(roleId, { $set: updateData }, { new: true, runValidators: true });
      if (menuIds && Array.isArray(menuIds)) {
        await RoleMenuModel.deleteMany({ roleId });
        if (menuIds.length > 0) {
          const roleMenuDocs = menuIds.map((menuId) => ({
            roleId: new Types2.ObjectId(roleId),
            menuId: new Types2.ObjectId(menuId)
          }));
          await RoleMenuModel.insertMany(roleMenuDocs);
        }
      }
      if (deptIds && Array.isArray(deptIds)) {
        await RoleDeptModel.deleteMany({ roleId });
        if (deptIds.length > 0 && (dataScope2 === "2" || updateData.dataScope === "2")) {
          const roleDeptDocs = deptIds.map((deptId) => ({
            roleId: new Types2.ObjectId(roleId),
            deptId: new Types2.ObjectId(deptId)
          }));
          await RoleDeptModel.insertMany(roleDeptDocs);
        }
      }
      res.json({
        code: 200,
        msg: "\u66F4\u65B0\u6210\u529F",
        data: updatedRole
      });
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ code: 409, msg: "\u89D2\u8272\u540D\u79F0\u5DF2\u5B58\u5728" });
      }
      console.error("\u66F4\u65B0\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 删除角色
   */
  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      await RoleModel.findByIdAndUpdate(id, { delFlag: "1" });
      await RoleMenuModel.deleteMany({ roleId: id });
      await RoleDeptModel.deleteMany({ roleId: id });
      res.json({
        code: 200,
        msg: "\u5220\u9664\u6210\u529F"
      });
    } catch (error) {
      console.error("\u5220\u9664\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取所有角色（用于下拉选择）
   */
  async getAllRoles(req, res) {
    try {
      const roles = await RoleModel.find({
        delFlag: { $ne: "1" },
        status: "0"
      }).select("_id name label").sort({ createdAt: 1 });
      const formattedRoles = roles.map((role) => ({
        id: role._id.toString(),
        name: role.name,
        label: role.label
      }));
      res.json({
        code: 200,
        msg: "success",
        data: formattedRoles
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u6240\u6709\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色关联的菜单树
   */
  async getRoleMenuTree(req, res) {
    try {
      const { roleId } = req.params;
      const allMenus = await MenuModel.getFullTree();
      const roleMenus = await RoleMenuModel.find({ roleId });
      const assignedMenuIds = new Set(roleMenus.map((rm) => rm.menuId.toString()));
      const markAssigned = (menus) => {
        return menus.map((menu) => {
          const isAssigned = assignedMenuIds.has(menu.id);
          const children = menu.children ? markAssigned(menu.children) : [];
          return {
            ...menu,
            checked: isAssigned,
            children
          };
        });
      };
      const menuTree = markAssigned(allMenus);
      res.json({
        code: 200,
        msg: "success",
        data: menuTree
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u83DC\u5355\u6811\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色关联的部门树
   */
  async getRoleDeptTree(req, res) {
    try {
      const { roleId } = req.params;
      const allDepts = await DeptModel.find({ delFlag: "0" });
      const buildDeptTree = (parentId = null) => {
        return allDepts.filter((dept) => {
          if (parentId === null) return !dept.parentId;
          return dept.parentId?.toString() === parentId;
        }).map((dept) => {
          const children = buildDeptTree(dept._id.toString());
          return {
            id: dept._id.toString(),
            label: dept.name,
            children: children.length > 0 ? children : void 0
          };
        });
      };
      const deptTree = buildDeptTree();
      const roleDepts = await RoleDeptModel.find({ roleId });
      const assignedDeptIds = new Set(roleDepts.map((rd) => rd.deptId.toString()));
      const markAssigned = (depts) => {
        return depts.map((dept) => {
          const isAssigned = assignedDeptIds.has(dept.id);
          const children = dept.children ? markAssigned(dept.children) : [];
          return {
            ...dept,
            checked: isAssigned,
            children
          };
        });
      };
      const markedDeptTree = markAssigned(deptTree);
      res.json({
        code: 200,
        msg: "success",
        data: markedDeptTree
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u90E8\u95E8\u6811\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色已分配的菜单ID列表
   */
  async getRoleMenus(req, res) {
    try {
      const { roleId } = req.params;
      const roleMenus = await RoleMenuModel.find({ roleId });
      const menuIds = roleMenus.map((rm) => rm.menuId.toString());
      res.json({
        code: 200,
        msg: "success",
        data: menuIds
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u83DC\u5355\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色已分配的部门ID列表
   */
  async getRoleDepts(req, res) {
    try {
      const { roleId } = req.params;
      const roleDepts = await RoleDeptModel.find({ roleId });
      const deptIds = roleDepts.map((rd) => rd.deptId.toString());
      res.json({
        code: 200,
        msg: "success",
        data: deptIds
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 分配角色菜单权限
   */
  async assignRoleMenus(req, res) {
    try {
      const { roleId } = req.params;
      const { menuIds } = req.body;
      const roleIdStr = roleId;
      const role = await RoleModel.findById(roleIdStr);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      await RoleMenuModel.deleteMany({ roleId: roleIdStr });
      if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
        const roleMenuDocs = menuIds.map((menuId) => ({
          roleId: new Types2.ObjectId(roleIdStr),
          menuId: new Types2.ObjectId(menuId)
        }));
        await RoleMenuModel.insertMany(roleMenuDocs);
      }
      res.json({
        code: 200,
        msg: "\u83DC\u5355\u5206\u914D\u6210\u529F"
      });
    } catch (error) {
      console.error("\u5206\u914D\u89D2\u8272\u83DC\u5355\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 分配角色部门权限
   */
  async assignRoleDepts(req, res) {
    try {
      const { roleId } = req.params;
      const { deptIds } = req.body;
      const roleIdStr = roleId;
      const role = await RoleModel.findById(roleIdStr);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      await RoleDeptModel.deleteMany({ roleId: roleIdStr });
      if (deptIds && Array.isArray(deptIds) && deptIds.length > 0) {
        const roleDeptDocs = deptIds.map((deptId) => ({
          roleId: new Types2.ObjectId(roleIdStr),
          deptId: new Types2.ObjectId(deptId)
        }));
        await RoleDeptModel.insertMany(roleDeptDocs);
      }
      res.json({
        code: 200,
        msg: "\u90E8\u95E8\u5206\u914D\u6210\u529F"
      });
    } catch (error) {
      console.error("\u5206\u914D\u89D2\u8272\u90E8\u95E8\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
};
var roleController_default = new RoleController();

// src/controller/modules/test/testController.ts
async function query(req, res, next) {
  try {
    logger.debug("\u521B\u5EFA\u7528\u6237\u8BF7\u6C42", { body: req.body });
    const user = await testModel.create(req.body);
    logger.success("\u7528\u6237\u521B\u5EFA\u6210\u529F", { id: user._id, email: user.email });
    res.status(201).json({
      success: true,
      message: "\u7528\u6237\u521B\u5EFA\u6210\u529F",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11e3) {
      return res.status(409).json({
        success: false,
        message: "\u8BE5\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C"
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        errors: messages
      });
    }
    console.error("\u521B\u5EFA\u7528\u6237\u5931\u8D25:", error);
    res.status(500).json({
      success: false,
      message: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
}
var testController_default = {
  query
};

// src/services/userRole.service.ts
import { Types as Types3 } from "mongoose";
var UserRoleService = class {
  /**
   * 为用户分配角色
   */
  async assignRolesToUser(userId, roleIds) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const roles = await RoleModel.find({ _id: { $in: roleIds }, delFlag: "0", status: "0" });
    if (roles.length !== roleIds.length) {
      throw new Error("\u90E8\u5206\u89D2\u8272\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
    }
    await UserRoleModel.deleteMany({ userId: new Types3.ObjectId(userId) });
    if (roleIds.length > 0) {
      const userRoleDocs = roleIds.map((roleId) => ({
        userId: new Types3.ObjectId(userId),
        roleId: new Types3.ObjectId(roleId)
      }));
      await UserRoleModel.insertMany(userRoleDocs);
    }
    return { userId, roleIds };
  }
  /**
   * 获取用户的角色列表
   */
  async getUserRoles(userId) {
    const userRoles = await UserRoleModel.find({ userId }).populate({
      path: "roleId",
      select: "name label dataScope status",
      transform: (doc) => {
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            label: doc.label,
            dataScope: doc.dataScope,
            status: doc.status
          };
        }
        return doc;
      }
    }).lean();
    return userRoles.map((ur) => ur.roleId).filter(Boolean);
  }
  /**
   * 获取用户的角色ID列表
   */
  async getUserRoleIds(userId) {
    const userRoles = await UserRoleModel.find({ userId }).select("roleId");
    return userRoles.map((ur) => ur.roleId.toString());
  }
  /**
   * 获取用户的菜单权限（基于角色）
   */
  async getUserMenus(userId) {
    const userRoles = await UserRoleModel.find({ userId });
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) {
      return [];
    }
    const roleMenus = await RoleMenuModel.find({ roleId: { $in: roleIds } });
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId.toString()))];
    if (menuIds.length === 0) {
      return [];
    }
    const allMenus = await MenuModel.find({ _id: { $in: menuIds } }).sort("sort");
    const buildMenuTree = (parentId = null) => {
      return allMenus.filter((menu) => {
        if (parentId === null) return !menu.pid;
        return menu.pid?.toString() === parentId;
      }).map((menu) => {
        const children = buildMenuTree(menu._id.toString());
        return {
          ...menu.toObject(),
          children: children.length > 0 ? children : void 0
        };
      });
    };
    return buildMenuTree();
  }
  /**
   * 获取用户的权限标识列表（用于按钮权限控制）
   */
  async getUserPermissions(userId) {
    const userRoles = await UserRoleModel.find({ userId });
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) {
      return [];
    }
    const roleMenus = await RoleMenuModel.find({ roleId: { $in: roleIds } });
    const menuIds = roleMenus.map((rm) => rm.menuId);
    if (menuIds.length === 0) {
      return [];
    }
    const menus = await MenuModel.find({
      _id: { $in: menuIds },
      permission: { $exists: true, $ne: "" }
    }).select("permission");
    return menus.map((menu) => menu.permission).filter(Boolean);
  }
  /**
   * 获取用户的数据权限（部门ID列表）
   */
  async getUserDataScope(userId) {
    const userRoles = await UserRoleModel.find({ userId }).populate({
      path: "roleId",
      select: "dataScope"
    });
    const roles = userRoles.map((ur) => ur.roleId);
    if (roles.length === 0) {
      return { deptIds: [], dataScope: "5" };
    }
    const dataScopes = roles.map((role) => role.dataScope);
    const dataScope2 = this.getStrictestDataScope(dataScopes);
    let deptIds = [];
    if (dataScope2 === "1") {
      const allDepts = await DeptModel.find({ delFlag: "0" }).select("_id");
      deptIds = allDepts.map((dept) => dept._id.toString());
    } else if (dataScope2 === "2") {
      const roleIds = roles.map((role) => role._id);
      const roleDepts = await RoleDeptModel.find({ roleId: { $in: roleIds } });
      deptIds = [...new Set(roleDepts.map((rd) => rd.deptId.toString()))];
    } else if (dataScope2 === "3") {
      const user = await UserModel.findById(userId).select("deptId");
      if (user?.deptId) {
        deptIds = [user.deptId.toString()];
      }
    } else if (dataScope2 === "4") {
      const user = await UserModel.findById(userId).select("deptId");
      if (user?.deptId) {
        const dept = await DeptModel.findById(user.deptId);
        if (dept) {
          const childDepts = await DeptModel.find({
            ancestors: { $regex: `,${user.deptId.toString()},` },
            delFlag: "0"
          }).select("_id");
          deptIds = [user.deptId.toString(), ...childDepts.map((dept2) => dept2._id.toString())];
        }
      }
    }
    return { deptIds, dataScope: dataScope2 };
  }
  /**
   * 获取最严格的数据权限
   * 优先级：5 > 4 > 3 > 2 > 1
   */
  getStrictestDataScope(dataScopes) {
    if (dataScopes.includes("5")) return "5";
    if (dataScopes.includes("4")) return "4";
    if (dataScopes.includes("3")) return "3";
    if (dataScopes.includes("2")) return "2";
    return "1";
  }
  /**
   * 检查用户是否有某个权限
   */
  async hasPermission(userId, permission) {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }
  /**
   * 获取用户详情（包含角色信息）
   */
  async getUserWithRoles(userId) {
    const user = await UserModel.findById(userId).populate({
      path: "deptId",
      select: "name code",
      transform: (doc) => {
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            code: doc.code
          };
        }
        return doc;
      }
    }).select("-password");
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const roles = await this.getUserRoles(userId);
    return {
      ...user.toObject(),
      roles
    };
  }
  /**
   * 批量更新用户角色
   */
  async batchUpdateUserRoles(userIds, roleIds) {
    const users = await UserModel.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw new Error("\u90E8\u5206\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const roles = await RoleModel.find({ _id: { $in: roleIds }, delFlag: "0", status: "0" });
    if (roles.length !== roleIds.length) {
      throw new Error("\u90E8\u5206\u89D2\u8272\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528");
    }
    const results = [];
    for (const userId of userIds) {
      await this.assignRolesToUser(userId, roleIds);
      results.push({ userId, roleIds });
    }
    return results;
  }
};
var userRole_service_default = new UserRoleService();

// src/controller/modules/userRole/userRoleController.ts
var userRoleService = new UserRoleService();
var UserRoleController = class {
  /**
   * 为用户分配角色
   */
  async assignUserRoles(req, res) {
    try {
      const { userId, roleIds } = req.body;
      if (!userId || !Array.isArray(roleIds)) {
        return res.status(400).json({ code: 400, msg: "\u53C2\u6570\u9519\u8BEF" });
      }
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ code: 404, msg: "\u7528\u6237\u4E0D\u5B58\u5728" });
      }
      await userRoleService.assignRolesToUser(userId, roleIds);
      res.json({
        code: 200,
        msg: "\u89D2\u8272\u5206\u914D\u6210\u529F"
      });
    } catch (error) {
      if (error.message === "\u7528\u6237\u4E0D\u5B58\u5728" || error.message === "\u90E8\u5206\u89D2\u8272\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528") {
        return res.status(400).json({ code: 400, msg: error.message });
      }
      console.error("\u5206\u914D\u7528\u6237\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取用户的角色列表
   */
  async getUserRoles(req, res) {
    try {
      const { userId } = req.params;
      const userIdStr = userId;
      const roles = await userRoleService.getUserRoles(userIdStr);
      res.json({
        code: 200,
        msg: "success",
        data: roles
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u7528\u6237\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取用户的菜单权限
   */
  async getUserMenus(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      const menus = await userRoleService.getUserMenus(userId);
      res.json({
        code: 200,
        msg: "success",
        data: menus
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u7528\u6237\u83DC\u5355\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取用户的权限标识列表
   */
  async getUserPermissions(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      const permissions = await userRoleService.getUserPermissions(userId);
      res.json({
        code: 200,
        msg: "success",
        data: permissions
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u7528\u6237\u6743\u9650\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取用户的数据权限
   */
  async getUserDataScope(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      const dataScope2 = await userRoleService.getUserDataScope(userId);
      res.json({
        code: 200,
        msg: "success",
        data: dataScope2
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u7528\u6237\u6570\u636E\u6743\u9650\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 批量分配角色给用户
   */
  async batchAssignRoles(req, res) {
    try {
      const { userIds, roleIds } = req.body;
      if (!Array.isArray(userIds) || !Array.isArray(roleIds)) {
        return res.status(400).json({ code: 400, msg: "\u53C2\u6570\u9519\u8BEF" });
      }
      const results = await userRoleService.batchUpdateUserRoles(userIds, roleIds);
      res.json({
        code: 200,
        msg: "\u6279\u91CF\u5206\u914D\u6210\u529F",
        data: results
      });
    } catch (error) {
      if (error.message === "\u90E8\u5206\u7528\u6237\u4E0D\u5B58\u5728" || error.message === "\u90E8\u5206\u89D2\u8272\u4E0D\u5B58\u5728\u6216\u5DF2\u505C\u7528") {
        return res.status(400).json({ code: 400, msg: error.message });
      }
      console.error("\u6279\u91CF\u5206\u914D\u89D2\u8272\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取用户详情（包含角色信息）
   */
  async getUserWithRoles(req, res) {
    try {
      const { userId } = req.params;
      const userIdStr = userId;
      const userWithRoles = await userRoleService.getUserWithRoles(userIdStr);
      res.json({
        code: 200,
        msg: "success",
        data: userWithRoles
      });
    } catch (error) {
      if (error.message === "\u7528\u6237\u4E0D\u5B58\u5728") {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error("\u83B7\u53D6\u7528\u6237\u8BE6\u60C5\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 检查用户是否有某个权限
   */
  async checkUserPermission(req, res) {
    try {
      const userId = req.user?.userId;
      const { permission } = req.body;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      if (!permission) {
        return res.status(400).json({ code: 400, msg: "\u6743\u9650\u6807\u8BC6\u4E0D\u80FD\u4E3A\u7A7A" });
      }
      const hasPermission = await userRoleService.hasPermission(userId, permission);
      res.json({
        code: 200,
        msg: "success",
        data: { hasPermission }
      });
    } catch (error) {
      console.error("\u68C0\u67E5\u7528\u6237\u6743\u9650\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
  /**
   * 获取角色下的用户列表
   */
  async getRoleUsers(req, res) {
    try {
      const { roleId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === "1") {
        return res.status(404).json({ code: 404, msg: "\u89D2\u8272\u4E0D\u5B58\u5728" });
      }
      const { UserRoleModel: UserRoleModel2 } = await import("./userRole-GZ6MP356.js");
      const userRoles = await UserRoleModel2.find({ roleId }).skip(skip).limit(Number(limit));
      const userIds = userRoles.map((ur) => ur.userId);
      const users = await UserModel.find({ _id: { $in: userIds } }).populate("deptId", "name code").select("-password");
      const total = await UserRoleModel2.countDocuments({ roleId });
      res.json({
        code: 200,
        msg: "success",
        data: {
          list: users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u89D2\u8272\u7528\u6237\u5217\u8868\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
};
var userRoleController_default = new UserRoleController();

// src/controller/modules/users/userController.ts
import { validationResult } from "express-validator";

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var JwtUtil = class _JwtUtil {
  static instance;
  // 直接从 env 中读取配置
  secret;
  expiresIn;
  refreshSecret;
  refreshExpiresIn;
  constructor() {
    this.secret = env.JWT.SECRET;
    this.expiresIn = env.JWT.EXPIRES_IN;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || env.JWT.SECRET;
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  }
  static getInstance() {
    if (!_JwtUtil.instance) {
      _JwtUtil.instance = new _JwtUtil();
    }
    return _JwtUtil.instance;
  }
  /**
   * 生成 access token
   */
  getAccessToken(payload) {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn
    });
  }
  /**
   * 生成 refresh token
   */
  getRefreshToken(payload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn
    });
  }
  /**
   * 生成完整的 token 对
   */
  generateTokens(payload) {
    return {
      accessToken: this.getAccessToken(payload),
      refreshToken: this.getRefreshToken(payload)
    };
  }
  /**
   * 验证 access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (error) {
      return null;
    }
  }
  /**
   * 验证 refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);
      return decoded;
    } catch (error) {
      return null;
    }
  }
  /**
   * 从请求头中提取 token
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7);
  }
  /**
   * 刷新 token
   */
  refreshTokens(refreshToken) {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) return null;
    const { iat, exp, ...cleanPayload } = payload;
    return this.generateTokens(cleanPayload);
  }
};
var jwtUtil = JwtUtil.getInstance();

// src/middlewares/auth.ts
var authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ code: 401, msg: "\u672A\u767B\u5F55" });
    }
    const token = authHeader.substring(7);
    const payload = jwtUtil.verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ code: 401, msg: "token\u65E0\u6548" });
    }
    const user = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ code: 401, msg: "\u7528\u6237\u4E0D\u5B58\u5728" });
    }
    req.user = {
      ...payload,
      userId: user._id.toString(),
      account: user.account,
      deptId: user.deptId?.toString()
    };
    next();
  } catch (error) {
    res.status(500).json({ code: 500, msg: "\u8BA4\u8BC1\u5931\u8D25" });
  }
};

// src/middlewares/dataScope.ts
import mongoose7 from "mongoose";
var dataScope = (options) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next();
      }
      const userRoles = await UserRoleModel.find({ userId }).populate("roleId");
      const hasAllDataScope = userRoles.some((ur) => ur.roleId?.dataScope === "1");
      if (hasAllDataScope) {
        return next();
      }
      let deptIds = [];
      for (const ur of userRoles) {
        const role = ur.roleId;
        switch (role?.dataScope) {
          case "2":
            const roleDepts = await RoleDeptModel.find({ roleId: role._id });
            deptIds.push(...roleDepts.map((rd) => rd.deptId.toString()));
            break;
          case "3":
            deptIds.push(req.user?.deptId);
            break;
          case "4":
            const childDepts = await getChildDepts(req.user?.deptId);
            deptIds.push(req.user?.deptId, ...childDepts);
            break;
          case "5":
            break;
        }
      }
      deptIds = [...new Set(deptIds.filter(Boolean))];
      req.dataScope = {
        deptIds,
        deptAlias: options.deptAlias || "d",
        userAlias: options.userAlias || "u"
      };
      next();
    } catch (error) {
      next(error);
    }
  };
};
async function getChildDepts(deptId) {
  const DeptModel2 = mongoose7.model("Dept");
  const children = await DeptModel2.find({ parentId: deptId });
  let ids = [];
  for (const child of children) {
    ids.push(child._id.toString());
    const grandChildren = await getChildDepts(child._id.toString());
    ids = [...ids, ...grandChildren];
  }
  return ids;
}

// src/services/user.service.ts
import { Types as Types4 } from "mongoose";
var UserService = class {
  /**
   * 获取用户列表（带数据权限过滤）
   */
  async getUserList(query2, dataScope2) {
    const { page = 1, limit = 10, keyword, deptId } = query2;
    const skip = (Number(page) - 1) * Number(limit);
    const conditions = {};
    if (keyword) {
      conditions.$or = [{ account: new RegExp(keyword, "i") }, { username: new RegExp(keyword, "i") }, { phone: new RegExp(keyword, "i") }];
    }
    if (deptId) {
      conditions.deptId = new Types4.ObjectId(deptId);
    }
    if (dataScope2?.deptIds?.length > 0) {
      conditions.deptId = { $in: dataScope2.deptIds.map((id) => new Types4.ObjectId(id)) };
    }
    const total = await UserModel.countDocuments(conditions);
    const users = await UserModel.find(conditions).populate("deptId", "name code").select("-password").sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    return {
      list: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };
  }
  /**
   * 获取用户详情
   */
  async getUserById(id) {
    const user = await UserModel.findById(id).populate("deptId", "name code").select("-password");
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    const userRoles = await UserRoleModel.find({ userId: id }).populate("roleId");
    const roles = userRoles.map((ur) => {
      const role = ur.roleId;
      return {
        id: role._id ? role._id.toString() : role.id,
        name: role.name,
        label: role.label,
        dataScope: role.dataScope
      };
    });
    const userObj = user.toObject();
    userObj.roles = roles;
    return userObj;
  }
  /**
   * 创建用户
   */
  async createUser(data) {
    const user = await UserModel.create(data);
    return user;
  }
  /**
   * 更新用户
   */
  async updateUser(id, data) {
    const user = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select("-password");
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    return user;
  }
  /**
   * 删除用户
   */
  async deleteUser(id) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      throw new Error("\u7528\u6237\u4E0D\u5B58\u5728");
    }
    return user;
  }
};

// src/utils/userToken.ts
var generateUserToken = async (user) => {
  const userRole = user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "employee";
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    tokenVersion: user.tokenVersion,
    role: userRole
    // 加上 role
  });
  const userWithoutPassword = await UserModel.findById(user._id).select("-password");
  return {
    user: userWithoutPassword,
    ...tokens
  };
};
var generateUserTokenFromExisting = (user) => {
  const userRole = user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : "employee";
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    tokenVersion: user.tokenVersion,
    role: userRole
    // 加上 role
  });
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;
  return {
    user: userObj,
    // 注意这里返回的是 user，不是 userInfo
    ...tokens
  };
};

// src/controller/modules/users/userController.ts
var userService = new UserService();
var ALLOWED_UPDATE_FIELDS = ["username", "avatar", "phone", "email"];
var UNIQUE_FIELDS = [
  { field: "phone", message: "\u624B\u673A\u53F7\u5DF2\u88AB\u5176\u4ED6\u7528\u6237\u4F7F\u7528" },
  { field: "email", message: "\u90AE\u7BB1\u5DF2\u88AB\u5176\u4ED6\u7528\u6237\u4F7F\u7528" }
];
var register = async (req, res) => {
  try {
    const { account, password, username, deptId, phone, email } = req.body;
    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        msg: "\u8D26\u53F7\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    if (!deptId) {
      return res.status(400).json({
        code: 400,
        msg: "\u6240\u5C5E\u90E8\u95E8\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    const existingUser = await UserModel.findOne({ account });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        msg: "\u8BE5\u8D26\u53F7\u5DF2\u88AB\u6CE8\u518C"
      });
    }
    if (phone) {
      const existingPhone = await UserModel.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({
          code: 409,
          msg: "\u624B\u673A\u53F7\u5DF2\u88AB\u6CE8\u518C"
        });
      }
    }
    if (email) {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          code: 409,
          msg: "\u90AE\u7BB1\u5DF2\u88AB\u6CE8\u518C"
        });
      }
    }
    const userData = {
      account,
      password,
      username: username || "\u9ED8\u8BA4\u7528\u6237",
      deptId
      // 部门ID
    };
    if (phone) userData.phone = phone;
    if (email) userData.email = email;
    const user = await UserModel.create(userData);
    const tokenData = await generateUserToken(user);
    res.status(201).json({
      code: 201,
      msg: "\u7528\u6237\u521B\u5EFA\u6210\u529F",
      data: tokenData
    });
  } catch (error) {
    if (error.code === 11e3) {
      return res.status(409).json({
        code: 409,
        msg: "\u8BE5\u8D26\u53F7\u5DF2\u88AB\u6CE8\u518C"
      });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        code: 400,
        msg: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        errors: messages
      });
    }
    console.error("\u521B\u5EFA\u7528\u6237\u5931\u8D25:", error);
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};
var login = async (req, res) => {
  try {
    const { account, password, uuid, code } = req.body;
    if (!uuid || !code) {
      return res.status(400).json({ code: 400, msg: "\u9A8C\u8BC1\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    const isValidCaptcha = CaptchaUtil.verify(uuid, code);
    if (!isValidCaptcha) {
      console.log("\u9A8C\u8BC1\u7801\u9A8C\u8BC1\u5931\u8D25\uFF0CUUID:", uuid, "Code:", code);
      return res.status(400).json({ code: 400, msg: "\u9A8C\u8BC1\u7801\u9519\u8BEF\u6216\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u5237\u65B0\u9A8C\u8BC1\u7801" });
    }
    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        msg: "\u8D26\u53F7\u548C\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A"
      });
    }
    console.log("\u67E5\u627E\u7528\u6237:", account);
    const user = await UserModel.findOne({ account }).select("+password").populate("deptId", "name code");
    if (!user) {
      console.log("\u7528\u6237\u672A\u627E\u5230:", account);
      return res.status(401).json({
        code: 401,
        msg: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
      });
    }
    console.log("\u627E\u5230\u7528\u6237:", user.account, "\u5BC6\u7801\u957F\u5EA6:", user.password?.length);
    console.log("\u9A8C\u8BC1\u5BC6\u7801\uFF0C\u8F93\u5165\u5BC6\u7801\u957F\u5EA6:", password?.length);
    const isPasswordValid = await user.comparePassword(password);
    console.log("\u5BC6\u7801\u9A8C\u8BC1\u7ED3\u679C:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("\u5BC6\u7801\u9A8C\u8BC1\u5931\u8D25");
      return res.status(401).json({
        code: 401,
        msg: "\u7528\u6237\u540D\u6216\u5BC6\u7801\u9519\u8BEF"
      });
    }
    const tokenData = generateUserTokenFromExisting(user);
    res.status(200).json({
      code: 200,
      msg: "\u767B\u5F55\u6210\u529F",
      data: tokenData
    });
  } catch (error) {
    console.error("\u767B\u5F55\u5931\u8D25:", error);
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};
var changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword?.trim()) {
      return res.status(400).json({ code: 400, msg: "\u65E7\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (!newPassword?.trim()) {
      return res.status(400).json({ code: 400, msg: "\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({ code: 400, msg: "\u65B0\u5BC6\u7801\u4E0D\u80FD\u4E0E\u65E7\u5BC6\u7801\u76F8\u540C" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, msg: "\u65B0\u5BC6\u7801\u957F\u5EA6\u4E0D\u80FD\u5C0F\u4E8E6\u4F4D" });
    }
    const user = await UserModel.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ code: 404, msg: "\u7528\u6237\u4E0D\u5B58\u5728" });
    }
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ code: 400, msg: "\u65E7\u5BC6\u7801\u9519\u8BEF" });
    }
    user.password = newPassword;
    await user.save();
    await user.incrementTokenVersion();
    res.status(200).json({
      code: 200,
      msg: "\u5BC6\u7801\u4FEE\u6539\u6210\u529F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55"
    });
  } catch (error) {
    console.error("\u4FEE\u6539\u5BC6\u7801\u5931\u8D25:", error);
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};
var logout = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: "\u7528\u6237\u672A\u767B\u5F55"
      });
    }
    const user = await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });
    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: "\u7528\u6237\u4E0D\u5B58\u5728"
      });
    }
    res.status(200).json({ code: 200, msg: "\u9000\u51FA\u767B\u5F55\u6210\u529F" });
  } catch (error) {
    console.error("\u9000\u51FA\u767B\u5F55\u5931\u8D25:", error);
    res.status(500).json({
      code: 500,
      msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    });
  }
};
var updateUserInfo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        msg: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25",
        errors: errors.array().map((err) => ({ field: err.path, message: err.msg }))
      });
    }
    const updateData = Object.keys(req.body).filter((key) => ALLOWED_UPDATE_FIELDS.includes(key)).reduce(
      (obj, key) => {
        obj[key] = req.body[key];
        return obj;
      },
      {}
    );
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ code: 400, msg: "\u6CA1\u6709\u63D0\u4F9B\u53EF\u66F4\u65B0\u7684\u5B57\u6BB5" });
    }
    for (const { field, message } of UNIQUE_FIELDS) {
      if (updateData[field]) {
        const existingUser = await UserModel.findOne({
          [field]: updateData[field],
          _id: { $ne: userId }
        });
        if (existingUser) {
          return res.status(409).json({ code: 409, msg: message });
        }
      }
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select("-password").populate("deptId", "name code");
    if (!updatedUser) {
      return res.status(404).json({ code: 404, msg: "\u7528\u6237\u4E0D\u5B58\u5728" });
    }
    res.status(200).json({
      code: 200,
      msg: "\u7528\u6237\u4FE1\u606F\u4FEE\u6539\u6210\u529F",
      data: updatedUser
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ code: 400, msg: "\u6570\u636E\u9A8C\u8BC1\u5931\u8D25", errors: messages });
    }
    if (error.code === 11e3) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === "phone" ? "\u624B\u673A\u53F7" : field === "email" ? "\u90AE\u7BB1" : field;
      return res.status(409).json({ code: 409, msg: `${fieldName}\u5DF2\u88AB\u4F7F\u7528` });
    }
    console.error("\u4FEE\u6539\u7528\u6237\u4FE1\u606F\u5931\u8D25:", error);
    res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" });
  }
};
var getUserList = [
  authenticate,
  dataScope({ deptAlias: "d", userAlias: "u" }),
  async (req, res) => {
    try {
      const result = await userService.getUserList(req.query, req.dataScope);
      res.json({
        code: 200,
        msg: "success",
        data: result
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u7528\u6237\u5217\u8868\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var getUserDetail = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json({
        code: 200,
        msg: "success",
        data: user
      });
    } catch (error) {
      if (error.message === "\u7528\u6237\u4E0D\u5B58\u5728") {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error("\u83B7\u53D6\u7528\u6237\u8BE6\u60C5\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var createUser = [
  authenticate,
  async (req, res) => {
    try {
      const { account, password, username, deptId, phone, email } = req.body;
      if (!account || !password || !deptId) {
        return res.status(400).json({
          code: 400,
          msg: "\u8D26\u53F7\u3001\u5BC6\u7801\u3001\u6240\u5C5E\u90E8\u95E8\u4E0D\u80FD\u4E3A\u7A7A"
        });
      }
      const existingUser = await UserModel.findOne({ account });
      if (existingUser) {
        return res.status(409).json({
          code: 409,
          msg: "\u8BE5\u8D26\u53F7\u5DF2\u88AB\u6CE8\u518C"
        });
      }
      const userData = {
        account,
        password,
        username: username || "\u9ED8\u8BA4\u7528\u6237",
        deptId
      };
      if (phone) userData.phone = phone;
      if (email) userData.email = email;
      const user = await UserModel.create(userData);
      res.status(201).json({
        code: 201,
        msg: "\u521B\u5EFA\u6210\u529F",
        data: user
      });
    } catch (error) {
      if (error.code === 11e3) {
        return res.status(409).json({ code: 409, msg: "\u8D26\u53F7\u5DF2\u5B58\u5728" });
      }
      console.error("\u521B\u5EFA\u7528\u6237\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var updateUser = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { username, phone, email, deptId, status } = req.body;
      const updateData = {};
      if (username) updateData.username = username;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;
      if (deptId) updateData.deptId = deptId;
      if (status !== void 0) updateData.status = status;
      const user = await userService.updateUser(id, updateData);
      res.json({
        code: 200,
        msg: "\u66F4\u65B0\u6210\u529F",
        data: user
      });
    } catch (error) {
      if (error.message === "\u7528\u6237\u4E0D\u5B58\u5728") {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error("\u66F4\u65B0\u7528\u6237\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var deleteUser = [
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (id === req.user?.userId) {
        return res.status(400).json({ code: 400, msg: "\u4E0D\u80FD\u5220\u9664\u5F53\u524D\u767B\u5F55\u8D26\u53F7" });
      }
      await userService.deleteUser(id);
      res.json({
        code: 200,
        msg: "\u5220\u9664\u6210\u529F"
      });
    } catch (error) {
      if (error.message === "\u7528\u6237\u4E0D\u5B58\u5728") {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error("\u5220\u9664\u7528\u6237\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var batchDeleteUsers = [
  authenticate,
  async (req, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ code: 400, msg: "\u8BF7\u9009\u62E9\u8981\u5220\u9664\u7684\u7528\u6237" });
      }
      const userId = req.user?.userId;
      if (ids.includes(userId)) {
        return res.status(400).json({ code: 400, msg: "\u4E0D\u80FD\u5220\u9664\u5F53\u524D\u767B\u5F55\u8D26\u53F7" });
      }
      for (const id of ids) {
        await userService.deleteUser(id);
      }
      res.json({
        code: 200,
        msg: "\u6279\u91CF\u5220\u9664\u6210\u529F"
      });
    } catch (error) {
      console.error("\u6279\u91CF\u5220\u9664\u7528\u6237\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var getCurrentUser = [
  authenticate,
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      const user = await userService.getUserById(userId);
      res.json({
        code: 200,
        msg: "success",
        data: user
      });
    } catch (error) {
      console.error("\u83B7\u53D6\u5F53\u524D\u7528\u6237\u4FE1\u606F\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u670D\u52A1\u5668\u9519\u8BEF" });
    }
  }
];
var userController_default = {
  register,
  login,
  changePassword,
  logout,
  updateUserInfo,
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  getCurrentUser
};

// src/controller/index.ts
var controller = {
  testController: testController_default,
  userController: userController_default,
  menuController: menuController_default,
  roleController: roleController_default,
  deptController: deptController_default,
  userRoleController: userRoleController_default
};
var controller_default = controller;

// src/middlewares/permission.ts
var userRoleService2 = new UserRoleService();
var checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: "\u8BF7\u5148\u767B\u5F55" });
      }
      const userRoles = await userRoleService2.getUserRoles(userId);
      const isSuperAdmin = userRoles.some((role) => role.name === "admin");
      if (isSuperAdmin) {
        return next();
      }
      const hasPerm = await userRoleService2.hasPermission(userId, permission);
      if (!hasPerm) {
        return res.status(403).json({ code: 403, msg: "\u6CA1\u6709\u64CD\u4F5C\u6743\u9650" });
      }
      next();
    } catch (error) {
      console.error("\u6743\u9650\u68C0\u67E5\u5931\u8D25:", error);
      res.status(500).json({ code: 500, msg: "\u6743\u9650\u68C0\u67E5\u5931\u8D25" });
    }
  };
};

// src/routes/modules/dept/dept.ts
var router2 = express.Router();
router2.use(authenticate);
router2.get("/tree", checkPermission("system:dept:list"), controller_default.deptController.getDeptTree);
router2.get("/all", checkPermission("system:dept:list"), controller_default.deptController.getAllDepts);
router2.get("/detail/:id", checkPermission("system:dept:query"), controller_default.deptController.getDeptDetail);
router2.post("/create", checkPermission("system:dept:add"), controller_default.deptController.createDept);
router2.put("/update/:id", checkPermission("system:dept:edit"), controller_default.deptController.updateDept);
router2.delete("/delete/:id", checkPermission("system:dept:remove"), controller_default.deptController.deleteDept);
router2.get("/stats", checkPermission("system:dept:list"), controller_default.deptController.getDeptUserStats);
var dept_default = router2;

// src/routes/modules/menu/menu.ts
import express2 from "express";
var router3 = express2.Router();
router3.use(authenticate);
router3.get("/tree", checkPermission("system:menu:list"), controller_default.menuController.findMenu);
router3.post("/addMenu", checkPermission("system:menu:add"), controller_default.menuController.addMenu);
router3.post("/updateMenu", checkPermission("system:menu:edit"), controller_default.menuController.updateMenu);
router3.post("/delMenu", checkPermission("system:menu:remove"), controller_default.menuController.delMenu);
router3.get("/findMenu", checkPermission("system:menu:list"), controller_default.menuController.findMenu);
router3.put("/update/:id", checkPermission("system:menu:edit"), controller_default.menuController.updateMenuRest);
router3.delete("/delete/:id", checkPermission("system:menu:remove"), controller_default.menuController.deleteMenuRest);
router3.get("/all", checkPermission("system:menu:list"), controller_default.menuController.getAllMenus);
var menu_default = router3;

// src/routes/modules/role/role.ts
import express3 from "express";
var router4 = express3.Router();
router4.use(authenticate);
router4.get("/list", checkPermission("system:role:list"), controller_default.roleController.getRoleList);
router4.get("/all", checkPermission("system:role:list"), controller_default.roleController.getAllRoles);
router4.get("/detail/:id", checkPermission("system:role:query"), controller_default.roleController.getRoleDetail);
router4.post("/create", checkPermission("system:role:add"), controller_default.roleController.createRole);
router4.put("/update/:id", checkPermission("system:role:edit"), controller_default.roleController.updateRole);
router4.delete("/delete/:id", checkPermission("system:role:remove"), controller_default.roleController.deleteRole);
router4.get("/:roleId/menu-tree", checkPermission("system:role:edit"), controller_default.roleController.getRoleMenuTree);
router4.get("/:roleId/dept-tree", checkPermission("system:role:edit"), controller_default.roleController.getRoleDeptTree);
router4.get("/:roleId/menus", checkPermission("system:role:edit"), controller_default.roleController.getRoleMenus);
router4.get("/:roleId/depts", checkPermission("system:role:edit"), controller_default.roleController.getRoleDepts);
router4.post("/:roleId/assign-menus", checkPermission("system:role:edit"), controller_default.roleController.assignRoleMenus);
router4.post("/:roleId/assign-depts", checkPermission("system:role:edit"), controller_default.roleController.assignRoleDepts);
var role_default = router4;

// src/routes/modules/test/test.ts
import express4 from "express";

// src/validation/models/menu/addMenu.ts
import { body, param } from "express-validator";

// src/utils/utils.ts
import { validationResult as validationResult2 } from "express-validator";
var handleValidationErrors = (req, res, next) => {
  const errors = validationResult2(req);
  if (!errors.isEmpty()) {
    logger.error("\u6570\u636E\u9519\u8BEF", errors.array());
    return res.status(200).json({
      code: 1e3,
      msg: "\u6570\u636E\u9519\u8BEF",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};
var utils_default = {
  handleValidationErrors
};

// src/validation/models/menu/addMenu.ts
var addMenu2 = [
  body("name").notEmpty().withMessage("\u83DC\u5355\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A").matches(/^[a-zA-Z][a-zA-Z0-9_]*$/).withMessage("\u83DC\u5355\u540D\u79F0\u5FC5\u987B\u4EE5\u5B57\u6BCD\u5F00\u5934\uFF0C\u53EA\u80FD\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u4E0B\u5212\u7EBF"),
  body("path").notEmpty().withMessage("\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A").matches(/^\/[a-zA-Z0-9_\-/]*$/).withMessage("\u8DEF\u5F84\u683C\u5F0F\u4E0D\u6B63\u786E"),
  body("component").notEmpty().withMessage("\u7EC4\u4EF6\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A"),
  body("title").notEmpty().withMessage("\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A"),
  utils_default.handleValidationErrors
];
var updateMenu2 = [
  param("id").isMongoId().withMessage("\u65E0\u6548\u7684\u83DC\u5355ID"),
  ...addMenu2
  // 复用添加的验证规则
];
var deleteMenu = [param("id").isMongoId().withMessage("\u65E0\u6548\u7684\u83DC\u5355ID"), utils_default.handleValidationErrors];

// src/validation/models/menu/index.ts
var menu_default2 = { addMenu: addMenu2 };

// src/validation/models/test/test.ts
import { body as body2, validationResult as validationResult3 } from "express-validator";
var validateCreateTest = [
  // 验证 name
  body2("name").notEmpty().withMessage("\u59D3\u540D\u4E0D\u80FD\u4E3A\u7A7A").isLength({ min: 2, max: 50 }).withMessage("\u59D3\u540D\u957F\u5EA6\u57282-50\u4E4B\u95F4").trim(),
  // 验证 email
  body2("email").notEmpty().withMessage("\u90AE\u7BB1\u4E0D\u80FD\u4E3A\u7A7A").isEmail().withMessage("\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E").normalizeEmail(),
  // 自动转为小写
  // 验证 age（可选）
  body2("age").optional().isInt({ min: 0, max: 120 }).withMessage("\u5E74\u9F84\u5FC5\u987B\u662F0-120\u4E4B\u95F4\u7684\u6574\u6570"),
  // 验证结果处理
  (req, res, next) => {
    const errors = validationResult3(req);
    if (!errors.isEmpty()) {
      logger.error("\u521B\u5EFA\u7528\u6237\u5931\u8D25", JSON.stringify(errors.array()));
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
var test_default = {
  validateCreateTest
};

// src/validation/models/users/register.ts
import { body as body3 } from "express-validator";
var register2 = [
  // 账号验证
  body3("account").notEmpty().withMessage("\u8D26\u53F7\u4E0D\u80FD\u4E3A\u7A7A").isLength({ min: 2, max: 50 }).withMessage("\u8D26\u53F7\u957F\u5EA6\u57282-50\u4E4B\u95F4").trim(),
  // 密码验证
  body3("password").notEmpty().withMessage("\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A").matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*_)[a-zA-Z0-9_]+$/).withMessage("\u5BC6\u7801\u5FC5\u987B\u5305\u542B\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u4E0B\u5212\u7EBF").isLength({ min: 2, max: 50 }).withMessage("\u5BC6\u7801\u957F\u5EA6\u57282-50\u4E4B\u95F4").trim()
];
var register_default = { register: register2 };

// src/validation/models/users/upDateUserInfo.ts
import { body as body4 } from "express-validator";
var updateUserInfo2 = [
  body4("username").optional().isLength({ min: 2, max: 30 }).withMessage("\u59D3\u540D\u957F\u5EA6\u57282-50\u4E4B\u95F4").trim(),
  body4("avatar").optional().isURL().withMessage("\u5934\u50CF\u5730\u5740\u4E0D\u6B63\u786E").trim(),
  body4("phone").optional().matches(/^1[3-9]\d{9}$/).withMessage("\u624B\u673A\u53F7\u8F93\u5165\u4E0D\u6B63\u786E").trim(),
  body4("email").optional().isEmail().withMessage("\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E").trim(),
  body4("department").optional().isLength({ max: 50 }).withMessage("\u90E8\u95E8\u540D\u79F0\u4E0D\u80FD\u8D85\u8FC750\u5B57").trim(),
  body4("employeeId").optional().isLength({ min: 2, max: 20 }).withMessage("\u5DE5\u53F7\u957F\u5EA6\u57282-20\u4E4B\u95F4").trim()
];
var upDateUserInfo_default = { updateUserInfo: updateUserInfo2 };

// src/validation/models/users/login.ts
import { body as body5 } from "express-validator";
var login2 = [
  // 账号验证
  body5("account").notEmpty().withMessage("\u8D26\u53F7\u4E0D\u80FD\u4E3A\u7A7A").isLength({ min: 2, max: 50 }).withMessage("\u8D26\u53F7\u957F\u5EA6\u57282-50\u4E4B\u95F4").trim(),
  // 密码验证（登录时不验证格式，只验证非空）
  body5("password").notEmpty().withMessage("\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A").trim(),
  // 验证码UUID
  body5("uuid").notEmpty().withMessage("\u9A8C\u8BC1\u7801UUID\u4E0D\u80FD\u4E3A\u7A7A").trim(),
  // 验证码
  body5("code").notEmpty().withMessage("\u9A8C\u8BC1\u7801\u4E0D\u80FD\u4E3A\u7A7A").trim()
];

// src/validation/models/users/index.ts
var users_default = {
  registerVie: register_default,
  updateUserInfo: upDateUserInfo_default,
  login: login2
};

// src/validation/index.ts
var vaiedation = {
  testViedation: test_default,
  userViedation: users_default,
  menuViedation: menu_default2
};
var validation_default = vaiedation;

// src/routes/modules/test/test.ts
var router5 = express4.Router();
router5.post("/test", validation_default.testViedation.validateCreateTest, controller_default.testController.query);
var test_default2 = router5;

// src/routes/modules/userRole/userRole.ts
import express5 from "express";
var router6 = express5.Router();
router6.use(authenticate);
router6.post("/assign", checkPermission("system:user:edit"), controller_default.userRoleController.assignUserRoles);
router6.post("/batch-assign", checkPermission("system:user:edit"), controller_default.userRoleController.batchAssignRoles);
router6.get("/user/:userId/roles", checkPermission("system:user:query"), controller_default.userRoleController.getUserRoles);
router6.get("/user/:userId/detail", checkPermission("system:user:query"), controller_default.userRoleController.getUserWithRoles);
router6.get("/role/:roleId/users", checkPermission("system:role:query"), controller_default.userRoleController.getRoleUsers);
router6.get("/current/menus", controller_default.userRoleController.getUserMenus);
router6.get("/current/permissions", controller_default.userRoleController.getUserPermissions);
router6.get("/current/data-scope", controller_default.userRoleController.getUserDataScope);
router6.post("/current/check-permission", controller_default.userRoleController.checkUserPermission);
var userRole_default = router6;

// src/routes/modules/users/users.ts
import express6 from "express";
var router7 = express6.Router();
router7.post("/register", RateLimiterUtil.register, validation_default.userViedation.registerVie.register, utils_default.handleValidationErrors, controller_default.userController.register);
router7.post("/login", RateLimiterUtil.login, validation_default.userViedation.login, utils_default.handleValidationErrors, controller_default.userController.login);
router7.post("/upDatePsw", authenticate, controller_default.userController.changePassword);
router7.post("/loginOut", authenticate, controller_default.userController.logout);
router7.post("/upDateUserInfo", authenticate, validation_default.userViedation.updateUserInfo.updateUserInfo, utils_default.handleValidationErrors, controller_default.userController.updateUserInfo);
router7.get("/detail/:id", authenticate, controller_default.userController.getUserDetail);
router7.get("/list", authenticate, dataScope({ deptAlias: "d", userAlias: "u" }), controller_default.userController.getUserList);
router7.post("/create", authenticate, controller_default.userController.createUser);
router7.put("/update/:id", authenticate, controller_default.userController.updateUser);
router7.delete("/delete/:id", authenticate, controller_default.userController.deleteUser);
router7.post("/batch-delete", authenticate, controller_default.userController.batchDeleteUsers);
router7.get("/current", authenticate, controller_default.userController.getCurrentUser);
var users_default2 = router7;

// src/routes/index.ts
var router8 = express7.Router();
router8.use("/test", test_default2);
router8.use("/user", users_default2);
router8.use("/menu", menu_default);
router8.use("/role", role_default);
router8.use("/dept", dept_default);
router8.use("/user-role", userRole_default);
router8.use("/captcha", captcha_default);
var routes_default = router8;

// src/utils/global.ts
if (!global.logger) {
  global.logger = logger2;
}

// src/app.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var captchaCleaner = startCaptchaCleaner(30);
if (!process.env.PORT) {
  console.warn("\u26A0\uFE0F PORT \u73AF\u5883\u53D8\u91CF\u672A\u8BBE\u7F6E\uFF0C\u5C06\u4F7F\u7528\u9ED8\u8BA4\u503C 3000");
}
console.log(`\u{1F30D} \u5F53\u524D\u73AF\u5883: ${process.env.NODE_ENV || "development"}`);
console.log(`\u{1F6AA} \u7AEF\u53E3: ${process.env.PORT || 3e3}`);
var app = express8();
app.use(logger_default);
app.use(SecurityConfig.hideServerInfo);
app.use(cors());
app.use(SecurityConfig.helmetConfig);
app.use(SecurityConfig.frameguard);
app.use(RateLimiterUtil.general);
app.use(express8.json({ limit: "10mb" }));
app.use(express8.urlencoded({ extended: true, limit: "10mb" }));
app.use(SecurityConfig.xssMiddleware);
app.use(SecurityConfig.sanitizeMiddleware);
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use(express8.json());
app.use(express8.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express8.static(path2.join(__dirname2, "public")));
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    env: process.env.NODE_ENV
  });
});
app.use(`/api`, routes_default);
app.use("*", (req, res) => {
  logger.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ code: 1e3, message: "\u63A5\u53E3\u4E0D\u5B58\u5728" });
});
app.use((err, req, res, next) => {
  logger.error("\u670D\u52A1\u5668\u9519\u8BEF", err);
  res.status(500).json({ code: 1e3, message: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" });
});
app.use((err, req, res, next) => {
  console.error("\u9519\u8BEF\u8BE6\u60C5:", err.stack);
  res.status(500).json({
    code: 1e3,
    message: "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF"
    // 生产环境不建议返回详细错误信息
    // error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
var app_default = app;

// src/server.ts
var debug = debugLib("my-backend-admin:server");
var port = env.PORT;
app_default.set("port", port);
var server = http.createServer(app_default);
async function bootstrap() {
  try {
    console.log(chalk2.blue("\u{1F504} \u6B63\u5728\u8FDE\u63A5 MongoDB..."));
    logger.info("\u6B63\u5728\u8FDE\u63A5\u6570\u636E\u5E93...");
    await connectMongoDB();
    console.log(chalk2.green("\u2705 MongoDB \u8FDE\u63A5\u6210\u529F"));
    logger.success("\u6570\u636E\u5E93\u8FDE\u63A5\u6210\u529F");
    server.listen(port);
    server.on("error", onError);
    server.on("listening", onListening);
    setupGracefulShutdown();
  } catch (error) {
    console.error(chalk2.red("\u274C \u670D\u52A1\u5668\u542F\u52A8\u5931\u8D25:"), error);
    logger.error("\u542F\u52A8\u5931\u8D25", error);
    process.exit(1);
  }
}
function setupGracefulShutdown() {
  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGUSR2", gracefulShutdown);
}
async function gracefulShutdown(signal) {
  console.log(chalk2.yellow(`
\u26A0\uFE0F \u6536\u5230 ${signal || "\u7EC8\u6B62"} \u4FE1\u53F7\uFF0C\u6B63\u5728\u4F18\u96C5\u5173\u95ED...`));
  server.close(async () => {
    console.log(chalk2.yellow("\u26A0\uFE0F HTTP \u670D\u52A1\u5668\u5DF2\u5173\u95ED"));
    try {
      const { mongoDB } = await import("./mongodb-OPTFMG32.js");
      await mongoDB.disconnect();
      console.log(chalk2.green("\u2705 \u6240\u6709\u8FDE\u63A5\u5DF2\u5173\u95ED"));
      process.exit(0);
    } catch (error) {
      console.error(chalk2.red("\u274C \u5173\u95ED\u8FDE\u63A5\u65F6\u51FA\u9519:"), error);
      process.exit(1);
    }
  });
  setTimeout(() => {
    console.error(chalk2.red("\u274C \u4F18\u96C5\u5173\u95ED\u8D85\u65F6\uFF0C\u5F3A\u5236\u9000\u51FA"));
    process.exit(1);
  }, 1e4);
}
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;
  switch (error.code) {
    case "EACCES":
      console.error(chalk2.red(`\u274C ${bind} \u9700\u8981\u66F4\u9AD8\u7684\u6743\u9650`));
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(chalk2.red(`\u274C ${bind} \u5DF2\u88AB\u5360\u7528`));
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr?.port;
  debug("Listening on " + bind);
  console.log(chalk2.green("\n\u{1F389} \u670D\u52A1\u542F\u52A8\u6210\u529F\uFF01"));
  console.log(chalk2.cyan("\u2501".repeat(50)));
  console.log(chalk2.white(`\u{1F4E1} \u670D\u52A1\u5730\u5740: ${chalk2.bold(`http://localhost:${env.PORT}`)}`));
  console.log(chalk2.white(`\u{1F30D} \u8FD0\u884C\u73AF\u5883: ${chalk2.bold(env.NODE_ENV)}`));
  console.log(chalk2.white(`\u{1F5C4}\uFE0F  \u6570\u636E\u5E93: ${chalk2.bold("MongoDB")} - ${env.MONGODB.DB_NAME}`));
  console.log(chalk2.white(`\u{1F517} API\u524D\u7F00: ${chalk2.bold(env.API_PREFIX)}`));
  console.log(chalk2.cyan("\u2501".repeat(50)));
  console.log(chalk2.gray("\u6309 Ctrl+C \u505C\u6B62\u670D\u52A1\n"));
}
bootstrap().catch((error) => {
  console.error(chalk2.red("\u274C \u542F\u52A8\u8FC7\u7A0B\u51FA\u9519:"), error);
  process.exit(1);
});
