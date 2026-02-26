// src/middlewares/auth.middleware.ts
import { jwtUtil } from '@/utils/jwt.ts';
export const authenticate = async (req: any, res: ExpressResponse, next: ExpressNext) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      logger.debug('token', '未提供认证令牌');
      return res.status(200).json({
        code: 401,
        msg: '未提供认证令牌',
      });
    }

    const payload = jwtUtil.verifyAccessToken(token);
    if (!payload) {
      logger.debug('token', '令牌无效或已过期');
      return res.status(200).json({
        code: 403,
        msg: '令牌无效或已过期',
      });
    }

    // 将用户信息挂载到 req 上
    req.user = payload;
    next();
  } catch (error) {
    logger.debug('token认证过程发生错误', error);
    res.status(200).json({
      code: 500,
      msg: '认证过程发生错误',
    });
  }
};
