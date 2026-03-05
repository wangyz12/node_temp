import { rateLimit } from 'express-rate-limit';
import { env } from '@/config/env.js';
import { logger } from '@/utils/logger.js';
import { Request, Response } from 'express';

/**
 * 限流配置选项接口
 */
interface RateLimiterOptions {
  windowMs: number; // 时间窗口（毫秒）
  max: number; // 最大请求次数
  message?: string; // 提示信息
  skipSuccessful?: boolean; // 是否跳过成功请求
  keyPrefix?: string; // 键前缀
}

/**
 * 限流工具类
 * 封装不同场景的限流器
 */
export class RateLimiterUtil {
  /**
   * 创建自定义限流器
   */
  static create(options: RateLimiterOptions) {
    const { windowMs, max, message = '请求过于频繁，请稍后再试', skipSuccessful = false, keyPrefix = 'rl' } = options;

    return rateLimit({
      windowMs,
      limit: max,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      keyGenerator: (req: Request) => {
        // 优先使用 X-Forwarded-For 头（经过代理时）
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
          return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        }
        // 使用 IP 地址
        return req.ip || req.socket.remoteAddress || 'unknown';
      },
      skipSuccessfulRequests: skipSuccessful,
      message: {
        code: 429,
        msg: message,
      },
      statusCode: 429,
      handler: (req: Request, res: Response) => {
        // 记录限流日志
        logger.warn(`🚫 限流触发: IP=${req.ip} 路径=${req.path} 窗口=${windowMs}ms 限制=${max}次`);

        res.status(429).json({
          code: 429,
          msg: message,
          data: null,
        });
      },
    });
  }

  /**
   * 通用限流器（用于全局）
   * 特点：宽松限制，防止基础攻击
   */
  static get general() {
    return this.create({
      windowMs: env.RATE_LIMIT.WINDOW_MS,
      max: env.RATE_LIMIT.MAX,
      message: '请求频率过高，请稍后再试',
      keyPrefix: 'general',
    });
  }

  /**
   * 登录专用限流器
   * 特点：严格限制，防止暴力破解
   */
  static get login() {
    return this.create({
      windowMs: env.RATE_LIMIT.LOGIN.WINDOW_MS,
      max: env.RATE_LIMIT.LOGIN.MAX,
      message: `登录尝试次数过多，请${Math.round(env.RATE_LIMIT.LOGIN.WINDOW_MS / 60000)}分钟后再试`,
      skipSuccessful: true, // 登录成功不计入限流
      keyPrefix: 'login',
    });
  }

  /**
   * 注册专用限流器
   * 特点：严格限制，防止恶意注册
   */
  static get register() {
    return this.create({
      windowMs: env.RATE_LIMIT.REGISTER.WINDOW_MS,
      max: env.RATE_LIMIT.REGISTER.MAX,
      message: `注册过于频繁，请${Math.round(env.RATE_LIMIT.REGISTER.WINDOW_MS / 60000)}分钟后再试`,
      keyPrefix: 'register',
    });
  }

  /**
   * 严格限流器（用于敏感操作）
   * 如：修改密码、修改手机号等
   */
  static get strict() {
    return this.create({
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 5, // 5次
      message: '操作过于频繁，请15分钟后再试',
      keyPrefix: 'strict',
    });
  }

  /**
   * 中等限流器（用于一般操作）
   */
  static get medium() {
    return this.create({
      windowMs: 60 * 1000, // 1分钟
      max: 30, // 30次
      message: '请求频率过高，请稍后再试',
      keyPrefix: 'medium',
    });
  }
}
