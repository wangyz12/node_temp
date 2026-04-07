// src/middlewares/auth.middleware.ts
import { UserModel } from '@/models/system/users/users';
import { jwtUtil } from '@/utils/jwt.ts';
import {
  OK,
  CREATED,
  NO_CONTENT,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
  NOT_IMPLEMENTED,
  BAD_GATEWAY,
  SERVICE_UNAVAILABLE,
} from '@/constants/httpStatus';

/**
 * 认证中间件
 * 验证用户是否已登录
 */
export const authenticate = async (req: ExpressRequest | any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(UNAUTHORIZED).json({ code: UNAUTHORIZED, msg: '未登录' });
    }

    const token = authHeader.substring(7);
    const payload = jwtUtil.verifyAccessToken(token);

    if (!payload) {
      return res.status(UNAUTHORIZED).json({ code: UNAUTHORIZED, msg: 'token无效' });
    }

    // 验证用户是否存在
    const user: any = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(UNAUTHORIZED).json({ code: UNAUTHORIZED, msg: '用户不存在' });
    }
    // 将用户信息挂载到请求对象
    req.user = {
      ...payload,
      userId: user._id.toString(),
      account: user.account,
      deptId: user.deptId?.toString(),
    };

    next();
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({ code: INTERNAL_SERVER_ERROR, msg: '认证失败' });
  }
};
