// src/services/user.service.ts
import { Types } from 'mongoose';

import { UserModel } from '@/models/system/users/users';
import { UserRoleModel } from '@/models/system/userRole/userRole';
import { RoleModel } from '@/models/system/role/role';
import { CaptchaUtil } from '@/utils/captcha.ts';
import { generateUserToken, generateUserTokenFromExisting } from '@/utils/userToken.ts';
import { DEFAULT_ROLE } from '@/constants/roles.ts';
import { DEFAULT_STATUS } from '@/constants/userStatus.ts';

// 允许修改的字段常量（管理员可以修改的字段）
const ALLOWED_UPDATE_FIELDS = ['username', 'avatar', 'phone', 'email', 'deptId', 'status'];

// 唯一字段检查配置
const UNIQUE_FIELDS = [
  { field: 'phone', message: '手机号已被其他用户使用' },
  { field: 'email', message: '邮箱已被其他用户使用' },
];

export class UserService {
  /**
   * 用户注册
   */
  async register(data: { account: string; password: string; username?: string; deptId: string; phone?: string; email?: string }) {
    const { account, password, username, deptId, phone, email } = data;

    // 基础验证
    if (!account || !password) {
      throw new Error('账号和密码不能为空');
    }

    if (!deptId) {
      throw new Error('所属部门不能为空');
    }

    // 检查账号是否已存在
    const existingUser = await UserModel.findOne({ account });
    if (existingUser) {
      throw new Error('该账号已被注册');
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await UserModel.findOne({ phone });
      if (existingPhone) {
        throw new Error('手机号已被注册');
      }
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        throw new Error('邮箱已被注册');
      }
    }

    // 构建用户数据
    const userData: any = {
      account,
      password,
      username: username || '默认用户',
      deptId: new Types.ObjectId(deptId),
      status: DEFAULT_STATUS,
    };

    if (phone) userData.phone = phone;
    if (email) userData.email = email;

    // 创建用户
    const user = await UserModel.create(userData);

    // 生成token
    const tokenData = await generateUserToken(user);

    return {
      user: tokenData.user,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    };
  }

  /**
   * 用户登录
   */
  async login(data: { account: string; password: string; uuid: string; code: string }) {
    const { account, password, uuid, code } = data;

    // 验证验证码
    if (!uuid || !code) {
      throw new Error('验证码不能为空');
    }

    const isValidCaptcha = CaptchaUtil.verify(uuid, code);
    if (!isValidCaptcha) {
      throw new Error('验证码错误或已过期，请刷新验证码');
    }

    if (!account || !password) {
      throw new Error('账号和密码不能为空');
    }

    // 查找用户（需要密码字段用于验证）
    const user = await UserModel.findOne({ account }).select('+password').populate('deptId', 'name code');

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 生成token
    const tokenData = await generateUserTokenFromExisting(user);

    return {
      user: tokenData.user,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
    };
  }

  /**
   * 修改密码
   */
  async changePassword(
    userId: string,
    data: {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  ) {
    const { oldPassword, newPassword, confirmPassword } = data;

    // 验证新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      throw new Error('新密码和确认密码不一致');
    }

    // 查找用户（需要密码字段）
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    const isOldPasswordValid = await user.comparePassword(oldPassword);
    if (!isOldPasswordValid) {
      throw new Error('旧密码错误');
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 增加token版本号，使所有旧token失效
    await user.incrementTokenVersion();

    return { success: true };
  }

  /**
   * 用户登出
   */
  async logout(userId: string) {
    // 增加token版本号，使当前token失效
    const user = await UserModel.findById(userId);
    if (user) {
      await user.incrementTokenVersion();
    }
    return { success: true };
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userId: string, data: any) {
    // 过滤允许更新的字段
    const updateData: any = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // 检查唯一字段
    for (const { field, message } of UNIQUE_FIELDS) {
      if (updateData[field]) {
        const existingUser = await UserModel.findOne({
          [field]: updateData[field],
          _id: { $ne: new Types.ObjectId(userId) },
        });
        if (existingUser) {
          throw new Error(message);
        }
      }
    }

    // 更新用户信息
    const user = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { returnDocument: 'after', runValidators: true }).select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  /**
   * 管理员创建用户
   */
  async createUserByAdmin(data: { account: string; password: string; username?: string; deptId: string; phone?: string; email?: string; status?: string; roles?: string[] }) {
    const { account, password, username, deptId, phone, email, status, roles } = data;

    // 基础验证
    if (!account || !password) {
      throw new Error('账号和密码不能为空');
    }

    if (!deptId) {
      throw new Error('所属部门不能为空');
    }

    // 检查账号是否已存在
    const existingUser = await UserModel.findOne({ account });
    if (existingUser) {
      throw new Error('该账号已被注册');
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await UserModel.findOne({ phone });
      if (existingPhone) {
        throw new Error('手机号已被注册');
      }
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        throw new Error('邮箱已被注册');
      }
    }

    // 构建用户数据
    const userData: any = {
      account,
      password,
      username: username || '默认用户',
      deptId: new Types.ObjectId(deptId),
      status: status || DEFAULT_STATUS,
    };

    if (phone) userData.phone = phone;
    if (email) userData.email = email;

    // 创建用户
    const user = await UserModel.create(userData);

    // 如果指定了角色，分配角色
    if (roles && roles.length > 0) {
      const roleAssignments = roles.map((roleId) => ({
        userId: user._id,
        roleId: new Types.ObjectId(roleId),
      }));
      await UserRoleModel.insertMany(roleAssignments);
    }

    // 返回用户信息（不包含密码）
    const userWithoutPassword = await UserModel.findById(user._id).select('-password');
    return userWithoutPassword;
  }

  /**
   * 获取用户列表（带数据权限过滤）
   */
  async getUserList(query: any, dataScope?: any) {
    const { page = 1, limit = 10, keyword, deptId } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: any = {};

    // 1. 关键词搜索
    if (keyword) {
      conditions.$or = [{ account: new RegExp(keyword, 'i') }, { username: new RegExp(keyword, 'i') }, { phone: new RegExp(keyword, 'i') }];
    }

    // 2. 指定部门查询
    if (deptId) {
      conditions.deptId = new Types.ObjectId(deptId);
    }

    // 3. 数据权限过滤
    if (dataScope?.deptIds?.length > 0) {
      conditions.deptId = { $in: dataScope.deptIds.map((id: any) => new Types.ObjectId(id)) };
    }

    // 查询总数
    const total = await UserModel.countDocuments(conditions);

    // 查询用户列表（关联部门信息）
    const users = await UserModel.find(conditions).populate('deptId', 'name code').select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    return {
      list: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * 获取用户详情
   */
  async getUserById(id: string) {
    const user = await UserModel.findById(id).populate('deptId', 'name code').select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户角色信息
    const userRoles = await UserRoleModel.find({ userId: id }).populate<{ roleId: any }>('roleId');
    const roles = userRoles.map((ur) => {
      const role = ur.roleId as any;
      return {
        id: role._id ? role._id.toString() : role.id,
        name: role.name,
        label: role.label,
        dataScope: role.dataScope,
      };
    });

    // 转换为普通对象并添加角色信息
    const userObj = user.toObject() as any;
    userObj.roles = roles;

    return userObj;
  }

  /**
   * 更新用户
   */
  async updateUser(id: string, data: any) {
    // 检查唯一字段（手机号和邮箱）
    for (const { field, message } of UNIQUE_FIELDS) {
      if (data[field]) {
        const existingUser = await UserModel.findOne({
          [field]: data[field],
          _id: { $ne: new Types.ObjectId(id) },
        });
        if (existingUser) {
          throw new Error(message);
        }
      }
    }

    const user = await UserModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
}
