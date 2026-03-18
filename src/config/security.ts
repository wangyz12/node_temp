import { NextFunction, Request, Response } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import xss from 'xss';

// import cors from 'cors';
import { env } from './env.ts';

/**
 * 通用安全配置
 * 包含：CORS、Helmet、限流、XSS过滤、参数过滤等
 */
export class SecurityConfig {
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
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
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
  static xssMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const filterXSS = (input: any): any => {
      if (typeof input === 'string') {
        return xss(input, {
          whiteList: {}, // 不允许任何HTML标签
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script', 'style'],
        });
      }
      if (Array.isArray(input)) {
        return input.map((item) => filterXSS(item));
      }
      if (input && typeof input === 'object') {
        const filtered: any = {};
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
    replaceWith: '_',
  });

  /**
   * 8. 防点击劫持
   */
  static frameguard = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  };

  /**
   * 9. 禁用服务器信息
   */
  static hideServerInfo = (req: Request, res: Response, next: NextFunction) => {
    res.removeHeader('X-Powered-By');
    next();
  };
}
