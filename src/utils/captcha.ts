// src/utils/captcha.util.ts
import svgCaptcha from 'svg-captcha';
import { v4 as uuidv4 } from 'uuid';

// 内存存储验证码
const captchaStore = new Map<
  string,
  {
    value: string;
    expires: number;
    createdAt: number; // 添加创建时间，用于统计
  }
>();

// ==================== 定时清理任务 ====================

/**
 * 清理过期的验证码
 * @param force 是否强制清理所有过期
 */
function cleanExpiredCaptchas(force: boolean = false) {
  const now = Date.now();
  let expiredCount = 0;
  const totalCount = captchaStore.size;

  for (const [key, value] of captchaStore.entries()) {
    if (value.expires < now) {
      captchaStore.delete(key);
      expiredCount++;
    }
  }

  if (expiredCount > 0 || force) {
    console.log(`🧹 [验证码清理] 删除了 ${expiredCount}/${totalCount} 个过期验证码，剩余 ${captchaStore.size} 个`);
  }

  return expiredCount;
}

/**
 * 强制清理所有验证码（紧急情况使用）
 */
function clearAllCaptchas() {
  const count = captchaStore.size;
  captchaStore.clear();
  console.log(`🧹 [验证码清理] 强制清空所有验证码，共删除 ${count} 个`);
  return count;
}

/**
 * 获取验证码存储统计信息
 */
function getCaptchaStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const value of captchaStore.values()) {
    if (value.expires > now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: captchaStore.size,
    active,
    expired,
    memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
  };
}

// ==================== 定时任务配置 ====================

/**
 * 启动定时清理任务
 * @param intervalMinutes 清理间隔（分钟）
 */
export function startCaptchaCleaner(intervalMinutes: number = 5) {
  console.log(`⏰ 验证码清理定时任务已启动，间隔 ${intervalMinutes} 分钟`);

  // 立即执行一次清理
  cleanExpiredCaptchas();

  // 定时清理
  const intervalId = setInterval(
    () => {
      const stats = getCaptchaStats();
      console.log(`📊 [验证码统计] 总数:${stats.total}, 有效:${stats.active}, 过期:${stats.expired}, 内存:${stats.memory}`);

      const cleaned = cleanExpiredCaptchas();

      // 如果过期验证码太多，记录警告
      if (stats.expired > 100) {
        console.warn(`⚠️ 过期验证码堆积较多(${stats.expired}个)，建议检查前端刷新机制`);
      }
    },
    intervalMinutes * 60 * 1000
  );

  // 返回清理函数，可用于手动触发
  return {
    stop: () => clearInterval(intervalId),
    clean: cleanExpiredCaptchas,
    clearAll: clearAllCaptchas,
    stats: getCaptchaStats,
  };
}

// ==================== 原有的 CaptchaUtil 类 ====================

export class CaptchaUtil {
  /**
   * 生成字符验证码
   */
  static generateCharCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
      background: '#f0f0f0',
      width: 120,
      height: 40,
    });

    const uuid = uuidv4();
    const now = Date.now();

    captchaStore.set(uuid, {
      value: captcha.text.toLowerCase(),
      expires: now + 5 * 60 * 1000, // 5分钟过期
      createdAt: now,
    });

    return {
      uuid,
      image: captcha.data,
    };
  }

  /**
   * 生成数学验证码
   */
  static generateMathCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    const expression = `${num1}${operator}${num2}=?`;
    let result: number;

    switch (operator) {
      case '+':
        result = num1 + num2;
        break;
      case '-':
        result = num1 - num2;
        break;
      case '*':
        result = num1 * num2;
        break;
      default:
        result = num1 + num2;
    }

    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 2,
      color: true,
      background: '#f0f0f0',
      width: 120,
      height: 40,
      fontSize: 48,
    });

    const uuid = uuidv4();
    const now = Date.now();

    captchaStore.set(uuid, {
      value: result.toString(),
      expires: now + 5 * 60 * 1000,
      createdAt: now,
    });

    return {
      uuid,
      image: captcha.data,
      expression,
    };
  }

  /**
   * 验证验证码
   */
  static verify(uuid: string, code: string): boolean {
    const captcha = captchaStore.get(uuid);
    if (!captcha) return false;

    // 检查是否过期
    if (captcha.expires < Date.now()) {
      captchaStore.delete(uuid);
      return false;
    }

    // 验证通过后删除
    const isValid = captcha.value === code.toLowerCase().trim();
    if (isValid) {
      captchaStore.delete(uuid);
    }

    return isValid;
  }

  /**
   * 主动删除验证码
   */
  static remove(uuid: string): boolean {
    return captchaStore.delete(uuid);
  }

  /**
   * 获取统计信息
   */
  static getStats() {
    return getCaptchaStats();
  }

  /**
   * 手动触发清理
   */
  static cleanExpired() {
    return cleanExpiredCaptchas(true);
  }
}

// ==================== 在文件末尾启动定时任务 ====================

// 只有在非测试环境下才自动启动定时任务
if (process.env.NODE_ENV !== 'test') {
  // 启动定时清理，每5分钟执行一次
  const cleaner = startCaptchaCleaner(5);

  // 可以挂载到全局，方便其他地方调用
  (global as any).__captchaCleaner__ = cleaner;
}
