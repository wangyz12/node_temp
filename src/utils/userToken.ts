import { jwtUtil } from './jwt.ts';
import { UserModel } from '@/models/index.ts';
import { IUser } from '@/models/users/users.ts';

/**
 * 为用户生成 token（并返回不含密码的用户信息）
 * @param user - 数据库查询出来的用户对象
 * @returns 包含用户信息和 token 的对象
 */
export const generateUserToken = async (user: IUser) => {
  // 1. 生成 token
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    role: user.role,
    tokenVersion: user.tokenVersion,
    // phone 和 email 可以不放在 token 里，需要时从 user 获取
  });

  // 2. 重新查询用户信息（不包含密码）
  const userWithoutPassword = await UserModel.findById(user._id).select('-password');

  return {
    user: userWithoutPassword,
    ...tokens,
  };
};

/**
 * 为用户生成 token（如果已经有用户对象，不需要重新查询）
 * @param user - 已经查询出来的用户对象
 * @returns 包含用户信息和 token 的对象
 */
export const generateUserTokenFromExisting = (user: IUser) => {
  // 1. 生成 token
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  // 2. 转换为普通对象并删除密码
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;

  return {
    user: userObj,
    ...tokens,
  };
};
