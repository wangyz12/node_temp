/**
 * Express 应用主配置文件
 *
 * 这个文件负责:
 * - 配置 Express 应用中间件
 * - 注册路由
 * - 设置错误处理
 */
// import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import express, { Express, NextFunction, Request, Response } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.ts';
import cors from 'cors';
import './utils/global.ts';
// 导入路由模块
import router from './routes/index.ts';
/**
 * 兼容 ESM 环境下的 __dirname 变量
 *
 * 在 ES Module 中，__dirname 和 __filename 不是全局变量，
 * 需要通过 import.meta.url 手动构造
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// // 加载环境变量 - 必须在最前面
// dotenv.config({
//   path: path.resolve(__dirname, '../.env'), // 从项目根目录加载
// });
// 验证关键环境变量是否加载
if (!process.env.PORT) {
  console.warn('⚠️ PORT 环境变量未设置，将使用默认值 3000');
}
console.log(`🌍 当前环境: ${process.env.NODE_ENV || 'development'}`);
console.log(`🚪 端口: ${process.env.PORT || 3000}`);
// 创建 Express 应用实例
const app: Express = express();

/**
 * ============================================
 * 全局中间件配置
 * ============================================
 */

/**
 * JSON 请求体解析中间件
 * 用于解析 Content-Type 为 application/json 的请求
 * 解析后的数据会挂载到 req.body 上
 */
app.use(express.json());

/**
 * URL-encoded 请求体解析中间件
 * 用于解析传统的表单提交请求
 * extended: false 表示使用 querystring 库解析（简单键值对）
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Cookie 解析中间件
 * 解析请求中的 Cookie 头，结果挂载到 req.cookies 上
 */
app.use(cookieParser());

/**
 * 静态文件服务中间件
 * 将 public 目录下的文件作为静态资源提供
 * 例如：public/images/logo.jpg 可通过 /images/logo.jpg 访问
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * ============================================
 * 路由注册
 * ============================================
 */

// 👇 关键：启用 CORS（放在路由之前）
app.use(cors());
/**
 * 根路由
 * 处理所有对 '/' 的请求
 */
app.use(`/api`, router);
// ========== 404 ==========
app.use('*', (req, res) => {
  logger.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ code: 1000, message: '接口不存在' });
});

// ========== 错误处理 ==========
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('服务器错误', err);
  res.status(500).json({ code: 1000, message: '服务器内部错误' });
});
/**
 * ============================================
 * 全局错误处理中间件
 * ============================================
 *
 * 错误处理中间件有4个参数: err, req, res, next
 * 必须放在所有路由之后
 * 当调用 next(err) 时，会跳转到此中间件
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // 打印错误堆栈（开发环境有用）
  console.error('错误详情:', err.stack);

  // 返回统一的错误响应格式
  res.status(500).json({
    code: 1000,
    message: '服务器内部错误',
    // 生产环境不建议返回详细错误信息
    // error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
// 导出配置好的 Express 应用实例
export default app;
