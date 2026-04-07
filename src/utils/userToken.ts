import { UserModel } from '@/models/index.ts';
import { UserRoleModel } from '@/models/system/userRole/userRole.ts';
import { IUser } from '@/models/system/users/users.ts';
import { DEFAULT_ROLE } from '@/constants/roles.ts';
import { jwtUtil } from './jwt.ts';

/**
 * 获取用户的主要角色
 */
async function getUserPrimaryRole(userId: string): Promise<string> {
  try {
    // 查找用户的角色关联
    const userRole = await UserRoleModel.findOne({ userId }).populate('roleId', 'name').sort({ createdAt: 1 }); // 按创建时间排序，取第一个

    if (userRole && (userRole.roleId as any)?.name) {
      return (userRole.roleId as any).name;
    }

    return DEFAULT_ROLE;
  } catch (error) {
    console.error('获取用户角色失败:', error);
    return DEFAULT_ROLE;
  }
}

/**
 * 为用户生成 token（并返回不含密码的用户信息）
 * @param user - 数据库查询出来的用户对象
 * @returns 包含用户信息和 token 的对象
 */
export const generateUserToken = async (user: IUser) => {
  // 从关联表中获取用户角色
  const userRole = await getUserPrimaryRole(user._id.toString());

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
export const generateUserTokenFromExisting = async (user: IUser) => {
  // 从关联表中获取用户角色
  const userRole = await getUserPrimaryRole(user._id.toString());

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
