#!/usr/bin/env node

/**
 * 服务器启动入口文件
 *
 * 这个文件负责连接数据库、创建 HTTP 服务器，
 * 并处理服务器的启动、错误和监听事件。
 */

import debugLib from 'debug';
import http from 'http';
import chalk from 'chalk';
import { env } from './config/env.js';
import { connectMongoDB } from './config/mongodb.js';
import app from './app.ts';
import { logger } from './utils/logger.ts';

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
 * 先连接数据库，再启动服务器
 */
async function bootstrap() {
  try {
    // 1. 先连接 MongoDB
    console.log(chalk.blue('🔄 正在连接 MongoDB...'));
    logger.info('正在连接数据库...');
    await connectMongoDB();
    console.log(chalk.green('✅ MongoDB 连接成功'));
    logger.success('数据库连接成功');

    // 2. 启动服务器
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

    // 3. 注册优雅关闭
    setupGracefulShutdown();
  } catch (error) {
    console.error(chalk.red('❌ 服务器启动失败:'), error);
    logger.error('启动失败', error);
    process.exit(1);
  }
}

/**
 * 设置优雅关闭
 * 当收到终止信号时，先关闭数据库连接，再退出进程
 */
function setupGracefulShutdown() {
  // 处理 Ctrl+C
  process.on('SIGINT', gracefulShutdown);

  // 处理终止信号
  process.on('SIGTERM', gracefulShutdown);

  // 处理 nodemon 重启
  process.on('SIGUSR2', gracefulShutdown);
}

/**
 * 优雅关闭函数
 */
async function gracefulShutdown(signal?: string) {
  console.log(chalk.yellow(`\n⚠️ 收到 ${signal || '终止'} 信号，正在优雅关闭...`));

  // 先停止接收新连接
  server.close(async () => {
    console.log(chalk.yellow('⚠️ HTTP 服务器已关闭'));

    try {
      // 关闭数据库连接
      const { mongoDB } = await import('./config/mongodb.js');
      await mongoDB.disconnect();
      console.log(chalk.green('✅ 所有连接已关闭'));

      process.exit(0);
    } catch (error) {
      console.error(chalk.red('❌ 关闭连接时出错:'), error);
      process.exit(1);
    }
  });

  // 设置超时，如果 10 秒内没有完成关闭，强制退出
  setTimeout(() => {
    console.error(chalk.red('❌ 优雅关闭超时，强制退出'));
    process.exit(1);
  }, 10000);
}

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
      console.error(chalk.red(`❌ ${bind} 需要更高的权限`));
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // 端口已被占用
      console.error(chalk.red(`❌ ${bind} 已被占用`));
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

  // 使用更美观的控制台输出
  console.log(chalk.green('\n🎉 服务启动成功！'));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.white(`📡 服务地址: ${chalk.bold(`http://localhost:${env.PORT}`)}`));
  console.log(chalk.white(`🌍 运行环境: ${chalk.bold(env.NODE_ENV)}`));
  console.log(chalk.white(`🗄️  数据库: ${chalk.bold('MongoDB')} - ${env.MONGODB.DB_NAME}`));
  console.log(chalk.white(`🔗 API前缀: ${chalk.bold(env.API_PREFIX)}`));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.gray('按 Ctrl+C 停止服务\n'));
}

// 启动服务器
bootstrap().catch((error) => {
  console.error(chalk.red('❌ 启动过程出错:'), error);
  process.exit(1);
});
