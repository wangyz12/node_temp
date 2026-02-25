// utils/global-logger.ts
import { logger as appLogger } from './logger.js';

// 声明全局类型
declare global {
  var logger: typeof appLogger;
}

// 挂载到全局
if (!global.logger) {
  global.logger = appLogger;
}

// 为了支持直接 import 的方式，也导出
export { appLogger as logger };
