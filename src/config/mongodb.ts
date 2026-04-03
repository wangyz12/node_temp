import chalk from 'chalk';
import mongoose from 'mongoose';

import { computedEnv as env } from './env';

/**
 * MongoDB 连接类
 * 使用单例模式管理连接，确保整个应用只有一个数据库连接实例
 *
 * 单例模式的好处：
 * 1. 避免重复创建连接，节省资源
 * 2. 统一管理连接状态
 * 3. 集中处理连接事件
 * 4. 实现自动重连和优雅关闭
 */
class MongoDBConnection {
  // 静态私有实例，存储唯一的连接对象
  private static instance: MongoDBConnection;

  // 连接状态标志
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5秒重连延迟
  private reconnectTimer: NodeJS.Timeout | null = null;

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
    if (this.isConnected || this.isConnecting) {
      console.log(chalk.yellow('⚠️ MongoDB 已经连接或正在连接中'));
      return;
    }

    this.isConnecting = true;

    try {
      // 配置Mongoose连接选项，启用自动重连
      const connectionOptions = {
        dbName: env.MONGODB.DB_NAME,
        ...env.MONGODB.OPTIONS,
        // 自动重连配置
        autoIndex: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // 使用IPv4，跳过IPv6
      };

      console.log(chalk.blue('🔗 正在连接 MongoDB...'));
      const conn = await mongoose.connect(env.MONGODB.URI, connectionOptions);

      // 更新连接状态
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0; // 重置重连尝试次数

      // 输出成功日志
      console.log(chalk.green('✅ MongoDB 连接成功:'), chalk.cyan(conn.connection.host));
      console.log(chalk.gray(`   数据库: ${env.MONGODB.DB_NAME}`));
      console.log(chalk.gray(`   连接池大小: ${connectionOptions.maxPoolSize}`));

      // 设置各种连接事件的监听器
      this.setupEventListeners();
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      
      // 连接失败时的错误处理
      console.error(chalk.red('❌ MongoDB 连接失败:'), error);
      
      // 如果是生产环境，尝试自动重连
      if (env.IS_PROD) {
        console.log(chalk.yellow(`⚠️ 将在 ${this.reconnectDelay / 1000} 秒后尝试重连...`));
        this.scheduleReconnect();
      } else {
        // 开发环境：抛出错误，由上层处理
        throw error;
      }
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
     */
    mongoose.connection.on('error', (err) => {
      console.error(chalk.red('❌ MongoDB 运行时错误:'), err.message);
      this.isConnected = false;
      
      // 如果是网络错误，尝试重连
      if (this.shouldAttemptReconnect(err)) {
        this.scheduleReconnect();
      }
    });

    /**
     * 监听断开连接事件
     * 当数据库连接意外断开时触发
     */
    mongoose.connection.on('disconnected', () => {
      console.log(chalk.yellow('⚠️ MongoDB 连接断开'));
      this.isConnected = false;
      
      // 断开5秒后尝试重连
      console.log(chalk.yellow(`⏰ 将在 5 秒后尝试重连...`));
      this.scheduleReconnect(5000);
    });

    /**
     * 监听重新连接事件
     * 当断开后成功重连时触发
     */
    mongoose.connection.on('reconnected', () => {
      console.log(chalk.green('🔄 MongoDB 重新连接成功'));
      this.isConnected = true;
      this.reconnectAttempts = 0; // 重置重连尝试次数
    });

    /**
     * 监听连接打开事件
     */
    mongoose.connection.on('connected', () => {
      console.log(chalk.green('🔗 MongoDB 连接已建立'));
      this.isConnected = true;
    });

    /**
     * 监听连接关闭事件
     */
    mongoose.connection.on('close', () => {
      console.log(chalk.yellow('🔒 MongoDB 连接已关闭'));
      this.isConnected = false;
    });

    // 设置优雅关闭监听器
    this.setupGracefulShutdown();
  }

  /**
   * 判断是否应该尝试重连
   */
  private shouldAttemptReconnect(error: any): boolean {
    // 这些错误类型通常表示网络问题，应该尝试重连
    const reconnectableErrors = [
      'MongoNetworkError',
      'MongoTimeoutError',
      'MongoServerSelectionError'
    ];
    
    return reconnectableErrors.some(errorType => 
      error.name?.includes(errorType) || error.message?.includes(errorType)
    );
  }

  /**
   * 安排重连尝试
   */
  private scheduleReconnect(delay: number = this.reconnectDelay): void {
    // 清除现有的重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 检查是否超过最大重连尝试次数
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(chalk.red(`❌ 已达到最大重连尝试次数 (${this.maxReconnectAttempts})，停止重连`));
      if (env.IS_PROD) {
        console.error(chalk.red('❌ 应用因数据库连接失败而退出'));
        process.exit(1);
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(chalk.yellow(`🔄 重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`));

    this.reconnectTimer = setTimeout(async () => {
      console.log(chalk.blue('🔄 正在尝试重新连接 MongoDB...'));
      try {
        await this.connect();
      } catch (error) {
        console.error(chalk.red('❌ 重连失败:'), error.message);
        // 失败后继续安排下一次重连
        this.scheduleReconnect(delay);
      }
    }, delay);
  }

  /**
   * 设置优雅关闭监听器
   */
  private setupGracefulShutdown(): void {
    /**
     * 优雅关闭：监听进程中断信号 (SIGINT)
     * 当用户按下 Ctrl+C 时触发
     */
    const gracefulShutdown = async (signal: string) => {
      console.log(chalk.yellow(`\n⚠️ 收到 ${signal} 信号，开始优雅关闭...`));
      
      // 清除重连定时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      try {
        // 关闭数据库连接
        if (mongoose.connection.readyState !== 0) { // 0 = disconnected
          console.log(chalk.yellow('🔒 正在关闭 MongoDB 连接...'));
          await mongoose.connection.close();
          console.log(chalk.green('✅ MongoDB 连接已关闭'));
        }
        
        console.log(chalk.green('🎉 优雅关闭完成'));
        process.exit(0);
      } catch (error) {
        console.error(chalk.red('❌ 关闭数据库连接时出错:'), error);
        process.exit(1);
      }
    };

    // 监听各种退出信号
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
    // 在开发环境中也监听SIGUSR2（nodemon重启）
    if (env.IS_DEV) {
      process.once('SIGUSR2', () => {
        gracefulShutdown('SIGUSR2 (nodemon restart)');
      });
    }
  }

  /**
   * 手动断开数据库连接
   * 用于需要主动关闭连接的场景
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      console.log(chalk.yellow('⚠️ MongoDB 已经断开连接'));
      return;
    }

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      console.log(chalk.yellow('🔒 正在手动关闭 MongoDB 连接...'));
      await mongoose.connection.close();
      this.isConnected = false;
      console.log(chalk.green('✅ MongoDB 连接已手动关闭'));
    } catch (error) {
      console.error(chalk.red('❌ 手动关闭连接时出错:'), error);
      throw error;
    }
  }

  /**
   * 获取当前连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * 获取连接详情
   */
  getConnectionInfo(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    readyState: number;
    host?: string;
    dbName?: string;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      dbName: mongoose.connection.db?.databaseName,
    };
  }
}

// 导出单例实例
export const mongoDB = MongoDBConnection.getInstance();

/**
 * 为了方便直接使用，也导出一个简洁的连接函数
 */
export const connectMongoDB = () => mongoDB.connect();
