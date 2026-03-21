// src/controller/modules/users/userController.ts
import { validationResult } from 'express-validator';

import { authenticate } from '@/middlewares/auth';
import { dataScope } from '@/middlewares/dataScope.ts';
import { UserModel } from '@/models/index.ts';
import { UserService } from '@/services/user.service';
import { CaptchaUtil } from '@/utils/captcha.ts';
import { generateUserToken, generateUserTokenFromExisting } from '@/utils/userToken.ts';

// 创建服务实例
const userService = new UserService();

// 允许修改的字段常量（管理员可以修改的字段）
const ALLOWED_UPDATE_FIELDS = ['username', 'avatar', 'phone', 'email', 'deptId', 'status'];

// 唯一字段检查配置（只保留 phone 和 email）
const UNIQUE_FIELDS = [
  { field: 'phone', message: '手机号已被其他用户使用' },
  { field: 'email', message: '邮箱已被其他用户使用' },
];

/**
 * 注册
 * 注意：注册时需要指定 deptId
 */
const register = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { account, password, username, deptId, phone, email } = req.body;

    // 基础验证
    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        msg: '账号和密码不能为空',
      });
    }

    if (!deptId) {
      return res.status(400).json({
        code: 400,
        msg: '所属部门不能为空',
      });
    }

    // 检查账号是否已存在
    const existingUser = await UserModel.findOne({ account });
    if (existingUser) {
      return res.status(409).json({
        code: 409,
        msg: '该账号已被注册',
      });
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await UserModel.findOne({ phone });
      if (existingPhone) {
        return res.status(409).json({
          code: 409,
          msg: '手机号已被注册',
        });
      }
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await UserModel.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({
          code: 409,
          msg: '邮箱已被注册',
        });
      }
    }

    // 构建用户数据
    const userData: any = {
      account,
      password,
      username: username || '默认用户',
      deptId, // 部门ID
    };

    if (phone) userData.phone = phone;
    if (email) userData.email = email;

    // 创建用户
    const user = await UserModel.create(userData);

    // 生成token
    const tokenData = await generateUserToken(user);

    res.status(200).json({
      code: 200,
      msg: '用户创建成功',
      data: tokenData,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        code: 409,
        msg: '该账号已被注册',
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        code: 400,
        msg: '数据验证失败',
        errors: messages,
      });
    }
    console.error('创建用户失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};

/**
 * 登录
 */
const login = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { account, password, uuid, code } = req.body;

    // 1. 验证验证码
    if (!uuid || !code) {
      return res.status(400).json({ code: 400, msg: '验证码不能为空' });
    }

    const isValidCaptcha = CaptchaUtil.verify(uuid, code);
    if (!isValidCaptcha) {
      console.log('验证码验证失败，UUID:', uuid, 'Code:', code);
      return res.status(400).json({ code: 400, msg: '验证码错误或已过期，请刷新验证码' });
    }

    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        msg: '账号和密码不能为空',
      });
    }

    // 2. 查找用户（需要密码字段用于验证）
    console.log('查找用户:', account);
    const user = await UserModel.findOne({ account }).select('+password').populate('deptId', 'name code'); // 关联部门信息

    if (!user) {
      console.log('用户未找到:', account);
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
      });
    }

    console.log('找到用户:', user.account, '密码长度:', user.password?.length);

    // 3. 验证密码
    console.log('验证密码，输入密码长度:', password?.length);
    const isPasswordValid = await user.comparePassword(password);
    console.log('密码验证结果:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('密码验证失败');
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
      });
    }

    // 4. 生成 token
    const tokenData = generateUserTokenFromExisting(user);

    res.status(200).json({
      code: 200,
      msg: '登录成功',
      data: tokenData,
    });
  } catch (error: any) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};

/**
 * 修改密码
 */
const changePassword = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: '请先登录' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword?.trim()) {
      return res.status(400).json({ code: 400, msg: '旧密码不能为空' });
    }

    if (!newPassword?.trim()) {
      return res.status(400).json({ code: 400, msg: '新密码不能为空' });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ code: 400, msg: '新密码不能与旧密码相同' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, msg: '新密码长度不能小于6位' });
    }

    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }

    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ code: 400, msg: '旧密码错误' });
    }

    user.password = newPassword;
    await user.save();
    await user.incrementTokenVersion();

    res.status(200).json({
      code: 200,
      msg: '密码修改成功，请重新登录',
    });
  } catch (error: any) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};

/**
 * 退出登录
 */
const logout = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        code: 401,
        msg: '用户未登录',
      });
    }

    const user = await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true });

    if (!user) {
      return res.status(404).json({
        code: 404,
        msg: '用户不存在',
      });
    }

    res.status(200).json({ code: 200, msg: '退出登录成功' });
  } catch (error: any) {
    console.error('退出登录失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};

/**
 * 修改用户信息
 */
const updateUserInfo = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ code: 401, msg: '请先登录' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        msg: '数据验证失败',
        errors: errors.array().map((err: any) => ({ field: err.path, message: err.msg })),
      });
    }

    // 过滤允许修改的字段（注意：不能修改 deptId）
    const updateData = Object.keys(req.body)
      .filter((key) => ALLOWED_UPDATE_FIELDS.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = req.body[key];
          return obj;
        },
        {} as Record<string, any>
      );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ code: 400, msg: '没有提供可更新的字段' });
    }

    // 批量检查唯一字段
    for (const { field, message } of UNIQUE_FIELDS) {
      if (updateData[field]) {
        const existingUser = await UserModel.findOne({
          [field]: updateData[field],
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(409).json({ code: 409, msg: message });
        }
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    )
      .select('-password')
      .populate('deptId', 'name code');

    if (!updatedUser) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }

    res.status(200).json({
      code: 200,
      msg: '用户信息修改成功',
      data: updatedUser,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ code: 400, msg: '数据验证失败', errors: messages });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'phone' ? '手机号' : field === 'email' ? '邮箱' : field;
      return res.status(409).json({ code: 409, msg: `${fieldName}已被使用` });
    }
    console.error('修改用户信息失败:', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
};

/**
 * 获取用户列表（带数据权限）
 */
export const getUserList = [
  authenticate,
  dataScope({ deptAlias: 'd', userAlias: 'u' }),
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const result = await userService.getUserList(req.query, req.dataScope);

      res.json({
        code: 200,
        msg: 'success',
        data: result,
      });
    } catch (error) {
      console.error('获取用户列表失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 获取用户详情
 */
export const getUserDetail = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { id }: any = req.params;
      const user = await userService.getUserById(id);

      res.json({
        code: 200,
        msg: 'success',
        data: user,
      });
    } catch (error: any) {
      if (error.message === '用户不存在') {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error('获取用户详情失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 创建用户（管理员）
 */
export const createUser = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { account, password, username, deptId, phone, email } = req.body;

      // 基础验证
      if (!account || !password || !deptId) {
        return res.status(400).json({
          code: 400,
          msg: '账号、密码、所属部门不能为空',
        });
      }

      // 检查账号是否已存在
      const existingUser = await UserModel.findOne({ account });
      if (existingUser) {
        return res.status(409).json({
          code: 409,
          msg: '该账号已被注册',
        });
      }

      const userData: any = {
        account,
        password,
        username: username || '默认用户',
        deptId,
      };

      if (phone) userData.phone = phone;
      if (email) userData.email = email;

      const user = await UserModel.create(userData);

      res.status(200).json({
        code: 200,
        msg: '创建成功',
        data: user,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ code: 409, msg: '账号已存在' });
      }
      console.error('创建用户失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 更新用户（管理员）
 */
export const updateUser = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { id }: any = req.params;
      const { username, phone, email, deptId, status }: any = req.body;

      const updateData: any = {};
      if (username) updateData.username = username;
      if (phone) updateData.phone = phone;
      if (email) updateData.email = email;
      if (deptId) updateData.deptId = deptId;
      if (status !== undefined) updateData.status = status;

      const user = await userService.updateUser(id, updateData);

      res.json({
        code: 200,
        msg: '更新成功',
        data: user,
      });
    } catch (error: any) {
      if (error.message === '用户不存在') {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error('更新用户失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 删除用户（管理员）
 */
export const deleteUser = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { id }: any = req.params;

      // 不能删除自己
      if (id === req.user?.userId) {
        return res.status(400).json({ code: 400, msg: '不能删除当前登录账号' });
      }

      await userService.deleteUser(id);

      res.json({
        code: 200,
        msg: '删除成功',
      });
    } catch (error: any) {
      if (error.message === '用户不存在') {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error('删除用户失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 批量删除用户
 */
export const batchDeleteUsers = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ code: 400, msg: '请选择要删除的用户' });
      }

      // 不能删除自己
      const userId = req.user?.userId;
      if (ids.includes(userId)) {
        return res.status(400).json({ code: 400, msg: '不能删除当前登录账号' });
      }

      // 批量删除
      for (const id of ids) {
        await userService.deleteUser(id);
      }

      res.json({
        code: 200,
        msg: '批量删除成功',
      });
    } catch (error) {
      console.error('批量删除用户失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

/**
 * 获取当前用户信息
 */
export const getCurrentUser = [
  authenticate,
  async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      const user = await userService.getUserById(userId);

      res.json({
        code: 200,
        msg: 'success',
        data: user,
      });
    } catch (error) {
      console.error('获取当前用户信息失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  },
];

export default {
  register,
  login,
  changePassword,
  logout,
  updateUserInfo,
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  getCurrentUser,
};
