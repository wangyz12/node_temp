import { UserModel } from '@/models/index.ts';
import { IUser } from '@/models/users/users.ts';
import { jwtUtil } from './jwt.ts';

/**
 * 为用户生成 token（并返回不含密码的用户信息）
 * @param user - 数据库查询出来的用户对象
 * @returns 包含用户信息和 token 的对象
 */
export const generateUserToken = async (user: IUser) => {
  // 从 user 中获取 userRole（roles 数组的第一个）
  const userRole = user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'employee';

  // 1. 生成 token - 👈 加上 role
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    tokenVersion: user.tokenVersion,
    role: userRole, // 加上 role
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
  // 从 user 中获取 userRole（roles 数组的第一个）
  const userRole = user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : 'employee';

  // 1. 生成 token - 👈 加上 role
  const tokens = jwtUtil.generateTokens({
    userId: user._id.toString(),
    account: user.account,
    tokenVersion: user.tokenVersion,
    role: userRole, // 加上 role
  });

  // 2. 转换为普通对象并删除密码
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.__v;

  return {
    user: userObj, // 注意这里返回的是 user，不是 userInfo
    ...tokens,
  };
};
