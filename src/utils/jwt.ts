import jwt from 'jsonwebtoken';
import { env } from '@/config/env.ts'; // 从你的 env.ts 导入

// 配置token的对象类型，可自行添加属性
export interface TokenPayload {
  userId: string;
  email?: string;
  role?: string;
  account: string;
  tokenVersion: number;
  phone?: string;
}
// 返回的token
export interface JwtTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * JWT 工具类 - 封装所有 JWT 相关操作
 */
export class JwtUtil {
  private static instance: JwtUtil;

  // 直接从 env 中读取配置
  private secret: string;
  private expiresIn: string;
  private refreshSecret: string;
  private refreshExpiresIn: string;

  private constructor() {
    this.secret = env.JWT.SECRET; // 从 env.JWT.SECRET 读取
    this.expiresIn = env.JWT.EXPIRES_IN; // 从 env.JWT.EXPIRES_IN 读取
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || env.JWT.SECRET;
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  static getInstance(): JwtUtil {
    if (!JwtUtil.instance) {
      JwtUtil.instance = new JwtUtil();
    }
    return JwtUtil.instance;
  }

  /**
   * 生成 access token
   */
  getAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as any,
    });
  }

  /**
   * 生成 refresh token
   */
  getRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: this.refreshExpiresIn as any,
    });
  }

  /**
   * 生成完整的 token 对
   */
  generateTokens(payload: TokenPayload): JwtTokens {
    return {
      accessToken: this.getAccessToken(payload),
      refreshToken: this.getRefreshToken(payload),
    };
  }

  /**
   * 验证 access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 验证 refresh token
   */
  verifyRefreshToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * 从请求头中提取 token
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // 去掉 'Bearer ' 前缀
  }

  /**
   * 刷新 token
   */
  refreshTokens(refreshToken: string): JwtTokens | null {
    const payload = this.verifyRefreshToken(refreshToken);
    if (!payload) return null;

    // 移除 jwt 添加的 iat、exp 等字段
    const { iat, exp, ...cleanPayload } = payload as any;
    return this.generateTokens(cleanPayload as TokenPayload);
  }
}

// 导出单例
export const jwtUtil = JwtUtil.getInstance();
