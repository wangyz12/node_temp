#!/usr/bin/env node

/**
 * 服务器启动入口文件
 *
 * 这个文件负责创建 HTTP 服务器，配置端口，
 * 并处理服务器的启动、错误和监听事件。
 */

import debugLib from 'debug';
import http from 'http';
import { env } from './config/env.js';
import app from './app.ts';

// 初始化调试模块，命名空间为 'my-backend-admin:server'
const debug = debugLib('my-backend-admin:server');

/**
 * 获取并标准化端口号
 * 优先使用环境变量中的 PORT，否则使用默认值 3000
 */
const port = env.PORT;
// 将端口设置到 Express 应用中，便于后续使用
app.set('port', port);

/**
 * 创建 HTTP 服务器
 * 将 Express 应用作为请求处理函数传入
 */
const server = http.createServer(app);

/**
 * 启动服务器
 * 监听指定端口，并注册错误和监听事件处理器
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * 标准化端口号
 *
 * @param val - 端口值（可以是字符串或数字）
 * @returns 标准化的端口（数字|字符串|false）
 *          - 如果是有效数字，返回数字类型端口
 *          - 如果是命名管道，返回字符串
 *          - 如果无效，返回 false
 */
// function normalizePort(val: string): string | number | false {
//   // 尝试将字符串转换为整数
//   const port = parseInt(val, 10);

//   // 如果转换失败（不是数字），说明是命名管道
//   if (isNaN(port)) {
//     return val;
//   }

//   // 如果端口号有效（大于等于0），返回数字
//   if (port >= 0) {
//     return port;
//   }

//   // 无效端口号
//   return false;
// }

/**
 * HTTP 服务器错误事件处理函数
 *
 * @param error - 错误对象
 * @throws 如果不是监听相关的错误，直接抛出
 */
function onError(error: NodeJS.ErrnoException): void {
  // 如果不是监听相关的错误，直接抛出
  if (error.syscall !== 'listen') {
    throw error;
  }

  // 获取绑定信息（用于错误提示）
  const bind =
    typeof port === 'string'
      ? 'Pipe ' + port // 命名管道
      : 'Port ' + port; // 端口号

  // 处理特定的监听错误
  switch (error.code) {
    case 'EACCES':
      // 权限不足（通常是因为使用小于1024的端口需要管理员权限）
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // 端口已被占用
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      // 其他未预料的错误
      throw error;
  }
}

/**
 * HTTP 服务器开始监听事件处理函数
 * 当服务器成功启动后执行
 */
function onListening(): void {
  // 获取服务器地址信息
  const addr = server.address();

  // 格式化地址信息用于显示
  const bind =
    typeof addr === 'string'
      ? 'pipe ' + addr // 命名管道
      : 'port ' + addr?.port; // 端口号

  // 输出调试信息
  debug('Listening on ' + bind);
  console.log(`🚀 服务器启动成功`);
  console.log(`📡 地址: http://localhost:${env.PORT}`);
  console.log(`🌍 环境: ${env.NODE_ENV}`);
}
