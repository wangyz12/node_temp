/**
 * 过滤敏感信息（密码、token等）
 */
const filterSensitiveData = (data: any): any => {
  if (!data) return data;
  // 如果是对象，递归处理
  if (typeof data === 'object' && data !== null) {
    // 如果是数组，处理每个元素
    if (Array.isArray(data)) {
      return data.map((item) => filterSensitiveData(item));
    }
    // 如果是普通对象，复制并过滤
    const filtered: any = {};
    for (const [key, value] of Object.entries(data)) {
      // 过滤敏感字段
      if (['password', 'oldPassword', 'newPassword', 'confirmPassword', 'token', 'refreshToken', 'authorization'].includes(key.toLowerCase())) {
        filtered[key] = '******'; // 敏感字段脱敏
      } else {
        filtered[key] = filterSensitiveData(value);
      }
    }
    return filtered;
  }
  // 基础类型直接返回
  return data;
};

/**
 * 接口请求/响应日志中间件
 * 自动记录请求信息、响应状态、耗时等
 */
const loggerMiddleware = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  // 记录请求开始时间
  const startTime = Date.now();
  const { method, url, body, query, ip } = req;

  // 过滤请求体中的敏感信息
  const filteredBody = filterSensitiveData(body);
  const filteredQuery = filterSensitiveData(query);

  // 1. 记录请求进入日志
  logger.info(`📥 [${method}] ${url} 请求`, {
    ip,
    body: method === 'POST' || method === 'PUT' || method === 'PATCH' ? filteredBody : '无请求体',
    query: Object.keys(filteredQuery).length > 0 ? filteredQuery : '无查询参数',
  });

  // 监听响应完成事件，记录响应日志
  res.on('finish', () => {
    const { statusCode } = res;
    const duration = Date.now() - startTime; // 接口耗时

    // 根据状态码区分日志级别和图标
    const logData = {
      statusCode,
      duration: `${duration}ms`,
    };

    if (statusCode >= 200 && statusCode < 300) {
      logger.success(`📤 [${method}] ${url} 响应成功`, logData);
    } else if (statusCode >= 300 && statusCode < 400) {
      logger.info(`↪️ [${method}] ${url} 重定向`, logData);
    } else if (statusCode >= 400 && statusCode < 500) {
      logger.warn(`⚠️ [${method}] ${url} 客户端错误`, logData);
    } else {
      logger.error(`❌ [${method}] ${url} 服务器错误`, logData);
    }
  });

  next();
};

export default loggerMiddleware;
