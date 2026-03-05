import { Request, Response, NextFunction } from 'express';
/**
 * 接口请求/响应日志中间件
 * 自动记录请求信息、响应状态、耗时等
 */
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 记录请求开始时间
  const startTime = Date.now();
  const { method, url, body, ip } = req;

  // 1. 记录请求进入日志
  logger.success(`[${method}] ${url} 请求`, {
    ip,
    body: method === 'POST' || method === 'PUT' ? body : '无请求体',
    query: req.query,
  });

  // 监听响应完成事件，记录响应日志
  res.on('finish', () => {
    const { statusCode } = res;
    const duration = Date.now() - startTime; // 接口耗时

    // 根据状态码区分日志级别
    if (statusCode >= 200 && statusCode < 400) {
      logger.success(`[${method}] ${url} 响应成功`, {
        statusCode,
        duration: `${duration}ms`,
      });
    } else if (statusCode >= 400 && statusCode < 500) {
      logger.warn(`[${method}] ${url} 客户端错误`, {
        statusCode,
        duration: `${duration}ms`,
      });
    } else {
      logger.error(`[${method}] ${url} 服务器错误`, {
        statusCode,
        duration: `${duration}ms`,
      });
    }
  });

  next();
};

export default loggerMiddleware;
