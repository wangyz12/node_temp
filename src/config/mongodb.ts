import mongoose from 'mongoose';
import chalk from 'chalk';
import { env } from './env.ts';

/**
 * MongoDB 连接类
 * 使用单例模式管理连接，确保整个应用只有一个数据库连接实例
 *
 * 单例模式的好处：
 * 1. 避免重复创建连接，节省资源
 * 2. 统一管理连接状态
 * 3. 集中处理连接事件
 */
class MongoDBConnection {
  // 静态私有实例，存储唯一的连接对象
  private static instance: MongoDBConnection;

  // 连接状态标志，true表示已连接，false表示未连接
  private isConnected = false;

  /**
   * 私有构造函数，防止外部通过 new 创建实例
   * 这是单例模式的核心
   */
  private constructor() {}

  /**
   * 获取单例实例的静态方法
   * 如果实例不存在，则创建新实例；否则返回已有实例
   */
  static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  /**
   * 连接 MongoDB 数据库
   * 1. 先检查是否已经连接，避免重复连接
   * 2. 使用 env 中的配置进行连接
   * 3. 连接成功后设置事件监听器
   * 4. 生产环境连接失败时退出进程
   */
  async connect(): Promise<void> {
    // 防止重复连接
    if (this.isConnected) {
      console.log(chalk.yellow('⚠️ MongoDB 已经连接'));
      return;
    }

    try {
      // mongoose.connect() 返回连接实例
      // 使用 env.MONGODB.URI 作为连接字符串
      // dbName 指定数据库名称
      // ...env.MONGODB.OPTIONS 展开其他配置选项（如连接池大小、超时时间等）
      const conn = await mongoose.connect(env.MONGODB.URI, {
        dbName: env.MONGODB.DB_NAME,
        ...env.MONGODB.OPTIONS,
      });

      // 更新连接状态
      this.isConnected = true;

      // 输出成功日志：显示连接成功和数据库主机地址
      console.log(chalk.green('✅ MongoDB 连接成功:'), chalk.cyan(conn.connection.host));

      // 设置各种连接事件的监听器
      this.setupEventListeners();
    } catch (error) {
      // 连接失败时的错误处理
      console.error(chalk.red('❌ MongoDB 连接失败:'), error);

      // 生产环境：连接失败直接退出进程，因为数据库无法连接服务无法正常运行
      if (env.IS_PROD) {
        process.exit(1);
      }

      // 开发环境：抛出错误，由上层处理
      throw error;
    }
  }

  /**
   * 设置 MongoDB 连接的事件监听器
   * 监听：错误、断开、重连等事件
   * 同时设置进程退出时的优雅关闭
   */
  private setupEventListeners(): void {
    /**
     * 监听连接错误事件
     * 当数据库运行过程中出现错误时触发
     * 例如：网络问题、认证失败等
     */
    mongoose.connection.on('error', (err) => {
      console.error(chalk.red('❌ MongoDB 运行时错误:'), err);
      this.isConnected = false; // 发生错误时标记为未连接
    });

    /**
     * 监听断开连接事件
     * 当数据库连接意外断开时触发
     * 注意：断开后 mongoose 会自动尝试重连
     */
    mongoose.connection.on('disconnected', () => {
      console.log(chalk.yellow('⚠️ MongoDB 连接断开'));
      this.isConnected = false;
    });

    /**
     * 监听重新连接事件
     * 当断开后成功重连时触发
     */
    mongoose.connection.on('reconnected', () => {
      console.log(chalk.green('🔄 MongoDB 重新连接成功'));
      this.isConnected = true;
    });

    /**
     * 优雅关闭：监听进程中断信号 (SIGINT)
     * 当用户按下 Ctrl+C 时触发
     * 先关闭数据库连接，再退出进程
     *
     * 为什么要优雅关闭？
     * 1. 确保正在进行的操作完成
     * 2. 避免数据丢失或损坏
     * 3. 释放资源
     */
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(chalk.yellow('⚠️ MongoDB 连接已关闭'));
      process.exit(0);
    });
  }

  /**
   * 手动断开数据库连接
   * 用于需要主动关闭连接的场景
   * 例如：测试用例执行完毕、应用关闭等
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return; // 如果已经断开，直接返回

    await mongoose.connection.close();
    this.isConnected = false;
    console.log(chalk.yellow('⚠️ MongoDB 连接已手动关闭'));
  }

  /**
   * 获取当前连接状态
   * 用于其他地方需要判断数据库连接状态时
   * @returns boolean - true: 已连接, false: 未连接
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// 导出单例实例
// 整个应用共享同一个 MongoDBConnection 实例
export const mongoDB = MongoDBConnection.getInstance();

/**
 * 为了方便直接使用，也导出一个简洁的连接函数
 * 这样在其他地方可以直接：
 * import { connectMongoDB } from './config/mongodb.js'
 * await connectMongoDB()
 */
export const connectMongoDB = () => mongoDB.connect();
