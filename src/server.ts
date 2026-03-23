#!/usr/bin/env node

/**
 * 服务器启动入口文件
 *
 * 这个文件负责连接数据库、创建 HTTP 服务器，
 * 并处理服务器的启动、错误和监听事件。
 */

import chalk from 'chalk';
import debugLib from 'debug';
import http from 'http';

import { env } from './config/env.ts';
import { connectMongoDB, mongoDB } from './config/mongodb.ts';
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
 * 先连接数据库，再启动服务器
 */
async function bootstrap(): Promise<void> {
  try {
    // 1. 先连接 MongoDB
    console.log(chalk.blue('🔄 正在连接 MongoDB...'));
    global.logger.info('正在连接数据库...');
    await connectMongoDB();
    console.log(chalk.green('✅ MongoDB 连接成功'));
    global.logger.success('数据库连接成功');

    // 2. 启动服务器
    server.listen(port, '0.0.0.0');
    server.on('error', onError);
    server.on('listening', onListening);

    // 3. 注册优雅关闭
    setupGracefulShutdown();
  } catch (error) {
    console.error(chalk.red('❌ 服务器启动失败:'), error);
    global.logger.error('启动失败', error);
    process.exit(1);
  }
}

/**
 * 设置优雅关闭
 * 当收到终止信号时，先关闭数据库连接，再退出进程
 */
function setupGracefulShutdown(): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  signals.forEach((signal) => {
    process.on(signal, () => gracefulShutdown(signal));
  });

  // 处理 nodemon 重启
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
}

/**
 * 优雅关闭函数
 * @param signal - 接收到的信号
 */
async function gracefulShutdown(signal?: string): Promise<void> {
  console.log(chalk.yellow(`\n⚠️ 收到 ${signal || '终止'} 信号，正在优雅关闭...`));
  global.logger.warn(`收到 ${signal || '终止'} 信号，开始优雅关闭`);

  // 设置超时强制退出
  const forceExitTimeout = setTimeout(() => {
    console.error(chalk.red('❌ 优雅关闭超时（10秒），强制退出'));
    global.logger.error('优雅关闭超时，强制退出');
    process.exit(1);
  }, 10000);

  try {
    // 停止接收新请求，等待现有请求完成
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log(chalk.yellow('⚠️ HTTP 服务器已关闭'));
          global.logger.info('HTTP 服务器已关闭');
          resolve();
        }
      });
    });

    // 关闭数据库连接
    if (mongoDB && typeof mongoDB.disconnect === 'function') {
      console.log(chalk.yellow('⚠️ 正在关闭数据库连接...'));
      global.logger.info('正在关闭数据库连接...');
      await mongoDB.disconnect();
      console.log(chalk.green('✅ 数据库连接已关闭'));
      global.logger.info('数据库连接已关闭');
    }

    console.log(chalk.green('✅ 优雅关闭完成'));
    global.logger.info('优雅关闭完成');
    clearTimeout(forceExitTimeout);
    process.exit(0);
  } catch (error) {
    console.error(chalk.red('❌ 优雅关闭失败:'), error);
    global.logger.error('优雅关闭失败', error);
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

/**
 * HTTP 服务器错误事件处理函数
 * @param error - 错误对象
 */
function onError(error: NodeJS.ErrnoException): void {
  // 如果不是监听相关的错误，直接抛出
  if (error.syscall !== 'listen') {
    global.logger.error('服务器非监听错误', error);
    throw error;
  }

  // 获取绑定信息（用于错误提示）
  const bind =
    typeof port === 'string'
      ? `Pipe ${port}` // 命名管道
      : `Port ${port}`; // 端口号

  // 处理特定的监听错误
  switch (error.code) {
    case 'EACCES':
      // 权限不足（通常是因为使用小于1024的端口需要管理员权限）
      console.error(chalk.red(`❌ ${bind} 需要更高的权限`));
      global.logger.error(`${bind} 权限不足`, { code: error.code });
      process.exit(1);
      break;
    case 'EADDRINUSE':
      // 端口已被占用
      console.error(chalk.red(`❌ ${bind} 已被占用`));
      global.logger.error(`${bind} 端口被占用`, { code: error.code });
      process.exit(1);
      break;
    default:
      // 其他未预料的错误
      global.logger.error('服务器监听错误', error);
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

  if (!addr) {
    global.logger.error('无法获取服务器地址信息');
    return;
  }

  // 格式化地址信息用于显示
  const bind =
    typeof addr === 'string'
      ? `pipe ${addr}` // 命名管道
      : `port ${addr.port}`; // 端口号

  // 输出调试信息
  debug(`Listening on ${bind}`);
  global.logger.info(`服务器启动成功，监听 ${bind}`);

  // 使用更美观的控制台输出
  console.log(chalk.green('\n🎉 服务启动成功！'));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.white(`📡 服务地址: ${chalk.bold(`http://localhost:${env.PORT}`)}`));
  console.log(chalk.white(`🌍 运行环境: ${chalk.bold(env.NODE_ENV || 'development')}`));
  console.log(chalk.white(`🗄️  数据库: ${chalk.bold('MongoDB')} - ${env.MONGODB?.DB_NAME || 'unknown'}`));
  console.log(chalk.white(`🔗 API前缀: ${chalk.bold(env.API_PREFIX || '/api')}`));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.gray('按 Ctrl+C 停止服务\n'));
}

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error(chalk.red('❌ 未处理的 Promise 拒绝:'), reason);
  global.logger.error('未处理的 Promise 拒绝', { reason, promise });
  // 不退出进程，只记录错误
});

// 捕获未捕获的异常
process.on('uncaughtException', (error: Error) => {
  console.error(chalk.red('❌ 未捕获的异常:'), error);
  global.logger.error('未捕获的异常', error);
  // 严重错误，优雅退出
  gracefulShutdown('uncaughtException').catch(() => {
    process.exit(1);
  });
});

// 启动服务器
bootstrap().catch((error) => {
  console.error(chalk.red('❌ 启动过程出错:'), error);
  global.logger.error('启动过程出错', error);
  process.exit(1);
});
