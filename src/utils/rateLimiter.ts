// src/utils/rateLimiter.ts - 简化版
import { rateLimit } from 'express-rate-limit';

import { logger } from '@/utils/logger.js';
import { TOO_MANY_REQUESTS } from '@/constants/httpStatus';

export class RateLimiterUtil {
  /**
   * 创建限流器
   */
  static create(options: { windowMs: number; max: number; message: string; skipSuccessful?: boolean }) {
    const { windowMs, max, message, skipSuccessful = false } = options;

    return rateLimit({
      windowMs,
      limit: max,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      skipSuccessfulRequests: skipSuccessful,
      message: { code: TOO_MANY_REQUESTS, msg: message },
      statusCode: 429,
      handler: (req, res) => {
        logger.warn(`限流触发: ${req.ip} - ${req.path}`);
        res.status(TOO_MANY_REQUESTS).json({ code: TOO_MANY_REQUESTS, msg: message });
      },
    });
  }

  // 预定义限流器
  static general = RateLimiterUtil.create({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: '请求过于频繁',
  });

  static login = RateLimiterUtil.create({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '登录尝试次数过多，请15分钟后再试',
    skipSuccessful: true,
  });

  static register = RateLimiterUtil.create({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: '注册过于频繁，请1小时后再试',
  });
}
