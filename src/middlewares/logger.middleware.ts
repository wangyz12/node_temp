import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.js';

/**
 * 请求日志中间件
 * 记录所有 HTTP 请求
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // 请求进来时记录
  logger.debug(`${req.method} ${req.url}`, {
    ip: req.ip,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  });

  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // 根据状态码选择日志级别
    if (status >= 500) {
      logger.error(`${req.method} ${req.url} ${status} ${duration}ms`);
    } else if (status >= 400) {
      logger.warn(`${req.method} ${req.url} ${status} ${duration}ms`);
    } else {
      logger.success(`${req.method} ${req.url} ${status} ${duration}ms`);
    }
  });

  next();
};
