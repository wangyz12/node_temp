// src/utils/bcrypt.util.ts
import bcrypt from 'bcrypt';

/**
 * Bcrypt 工具类
 * 用于密码加密和验证（推荐用于生产环境）
 */
export class BcryptUtil {
  // 盐的轮数，默认10（越高越安全，但越慢）
  private static readonly SALT_ROUNDS = 10;

  /**
   * 加密密码
   * @param password - 明文密码
   * @returns 返回加密后的哈希值
   */
  static async hash(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error: any) {
      throw new Error(`密码加密失败: ${error.message}`);
    }
  }

  /**
   * 同步方式加密密码
   */
  static hashSync(password: string): string {
    try {
      const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
      return bcrypt.hashSync(password, salt);
    } catch (error: any) {
      throw new Error(`密码加密失败: ${error.message}`);
    }
  }

  /**
   * 验证密码
   * @param password - 明文密码
   * @param hash - 加密后的哈希值
   * @returns 返回布尔值，true表示密码正确
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error: any) {
      throw new Error(`密码验证失败: ${error.message}`);
    }
  }

  /**
   * 同步方式验证密码
   */
  static verifySync(password: string, hash: string): boolean {
    try {
      return bcrypt.compareSync(password, hash);
    } catch (error: any) {
      throw new Error(`密码验证失败: ${error.message}`);
    }
  }
}

// 导出单例
export const bcryptUtil = BcryptUtil;
