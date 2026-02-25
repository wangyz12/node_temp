import crypto from 'crypto';

/**
 * MD5 工具类
 * 注意：MD5 仅适用于非安全场景（缓存键、文件校验等）
 * 密码加密请使用 bcrypt
 */
export class MD5Util {
  /**
   * 计算字符串的 MD5 哈希值
   * @param str - 要加密的字符串
   * @param salt - 可选盐值
   * @returns 32位小写 MD5 字符串
   */
  static hash(str: string, salt: string = ''): string {
    return crypto
      .createHash('md5')
      .update(str + salt)
      .digest('hex');
  }

  /**
   * 计算 Buffer 的 MD5 哈希值
   * @param data - Buffer 数据
   * @returns 32位小写 MD5 字符串
   */
  static hashBuffer(data: Buffer): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 计算文件的 MD5 哈希值
   * @param filePath - 文件路径
   * @returns Promise<string> MD5 字符串
   */
  static async hashFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * 验证字符串是否匹配 MD5
   * @param str - 原字符串
   * @param md5 - 要验证的 MD5 字符串
   * @param salt - 可选盐值
   * @returns boolean
   */
  static verify(str: string, md5: string, salt: string = ''): boolean {
    return this.hash(str, salt) === md5;
  }
}
