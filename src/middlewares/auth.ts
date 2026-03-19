// src/middlewares/auth.middleware.ts
import { UserModel } from '@/models/users/users.ts';
import { jwtUtil } from '@/utils/jwt.ts';

/**
 * 认证中间件
 * 验证用户是否已登录
 */
export const authenticate = async (req: ExpressRequest | any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, msg: '未登录' });
    }

    const token = authHeader.substring(7);
    const payload = jwtUtil.verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ code: 401, msg: 'token无效' });
    }

    // 验证用户是否存在
    const user: any = await UserModel.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ code: 401, msg: '用户不存在' });
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
    res.status(500).json({ code: 500, msg: '认证失败' });
  }
};
