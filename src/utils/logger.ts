import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

/**
 * 最简单的日志工具
 * 同时输出到控制台和文件
 * 自动保留最近7天的日志
 */
class SimpleLogger {
  private logDir: string;
  private todayLogFile: string;
  private maxAgeDays: number = 7; // 保留7天

  constructor() {
    // 在项目根目录创建 logs 文件夹
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDir();
    this.todayLogFile = this.getTodayLogFile();

    // 启动时清理过期日志
    this.cleanOldLogs();

    // 每天检查一次（可选，但构造函数只执行一次，所以这里不设置定时器）
    // 如果你想要每天自动清理，可以在每天第一次写入时检查
  }

  // 确保日志目录存在
  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // 获取今天的日志文件名
  private getTodayLogFile(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(this.logDir, `${year}-${month}-${day}.log`);
  }

  /**
   * 清理超过7天的日志文件
   */
  private cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const now = Date.now();
      const maxAge = this.maxAgeDays * 24 * 60 * 60 * 1000; // 7天的毫秒数

      files.forEach((file) => {
        // 只处理 .log 文件
        if (!file.endsWith('.log')) return;

        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs; // 文件的最后修改时间到现在的时间差

        // 如果文件超过7天，删除
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          console.log(chalk.gray(`🧹 清理过期日志: ${file}`));
        }
      });
    } catch (error: any) {
      // 清理失败不影响主程序
      console.error(chalk.yellow('⚠️ 清理旧日志失败:'), error.message);
    }
  }

  /**
   * 检查并清理（可以在每次写入时调用，但为了性能，可以每天只检查一次）
   */
  private checkAndCleanIfNeeded() {
    try {
      // 获取今天的日志文件名（用于判断是否需要检查）
      const today = this.getTodayLogFile();

      // 创建一个标记文件来记录上次清理时间
      const lastCleanFile = path.join(this.logDir, '.lastclean');

      let lastClean = 0;
      if (fs.existsSync(lastCleanFile)) {
        lastClean = parseInt(fs.readFileSync(lastCleanFile, 'utf-8')) || 0;
      }

      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      // 如果距离上次清理超过24小时，再次清理
      if (now - lastClean > oneDay) {
        this.cleanOldLogs();
        fs.writeFileSync(lastCleanFile, now.toString());
      }
    } catch (error) {
      // 忽略错误
    }
  }

  // 写入文件
  private writeToFile(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const logLine = `[${timestamp}] ${level} - ${message}${dataStr}\n`;

    try {
      fs.appendFileSync(this.todayLogFile, logLine);

      // 每次写入时检查是否需要清理（可选，如果担心性能可以注释掉）
      // this.checkAndCleanIfNeeded();
    } catch (error) {
      // 如果写入失败，至少不崩溃
      console.error('写入日志文件失败:', error);
    }
  }

  // 信息日志（蓝色）
  info(message: string, data?: any) {
    console.log(chalk.blue(`ℹ️ ${message}`), data ? chalk.gray(JSON.stringify(data)) : '');
    this.writeToFile('INFO', message, data);
  }

  // 成功日志（绿色）
  success(message: string, data?: any) {
    console.log(chalk.green(`✅ ${message}`), data ? chalk.gray(JSON.stringify(data)) : '');
    this.writeToFile('SUCCESS', message, data);
  }

  // 警告日志（黄色）
  warn(message: string, data?: any) {
    console.log(chalk.yellow(`⚠️ ${message}`), data ? chalk.gray(JSON.stringify(data)) : '');
    this.writeToFile('WARN', message, data);
  }

  // 错误日志（红色）
  error(message: string, error?: any) {
    console.error(chalk.red(`❌ ${message}`));
    if (error) {
      console.error(chalk.red(error.stack || error));
    }
    this.writeToFile('ERROR', message, { error: error?.message || error });
  }

  // 调试日志（灰色，只在开发环境输出）
  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray(`🔍 ${message}`), data ? chalk.gray(JSON.stringify(data)) : '');
    }
    this.writeToFile('DEBUG', message, data);
  }

  /**
   * 手动触发清理
   * 可以在需要时调用
   */
  manualClean() {
    this.cleanOldLogs();
  }

  /**
   * 设置保留天数
   */
  setMaxAge(days: number) {
    this.maxAgeDays = days;
    this.cleanOldLogs(); // 立即按新设置清理
  }
}

// 导出单例
export const logger = new SimpleLogger();
