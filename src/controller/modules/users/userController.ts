import { UserModel } from '@/models/index.ts';
import { validationResult } from 'express-validator';
import { generateUserToken, generateUserTokenFromExisting } from '@/utils/userToken.ts';
import { CaptchaUtil } from '@/utils/captcha.ts';
// 注册
const register = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // 直接从请求体创建用户
    const user = await UserModel.create(req.body);
    // 手动删除密码字段
    const tokenData = await generateUserToken(user);
    res.status(200).json({
      code: 200,
      msg: '用户创建成功',
      data: tokenData,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '该账号已被注册',
      });
    }
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: '数据验证失败',
        errors: messages,
      });
    }
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
    });
  }
};
// 登录
const login = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { account, password, captchaUuid, captchaCode } = req.body;
    // 1. 验证验证码
    if (!captchaUuid || !captchaCode) {
      return res.status(400).json({ code: 400, msg: '验证码不能为空' });
    }
    const isValidCaptcha = CaptchaUtil.verify(captchaUuid, captchaCode);
    if (!isValidCaptcha) {
      return res.status(400).json({ code: 400, msg: '验证码错误' });
    }
    // 1. 验证请求参数
    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        msg: '账号和密码不能为空',
      });
    }
    // 2. 查找用户（需要密码字段用于验证）
    const user = await UserModel.findOne({ account }).select('+password');
    // 3. 用户不存在
    if (!user) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
      });
    }
    // 4. 验证密码（注意：需要 await）
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        msg: '用户名或密码错误',
      });
    }
    // 5. 生成 token
    const tokenData = generateUserTokenFromExisting(user);
    // 7. 返回成功响应
    res.status(200).json({
      code: 200,
      msg: '登录成功',
      data: tokenData,
    });
  } catch (error: any) {
    // 错误处理
    // 数据库错误处理
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        code: 500,
        msg: '数据库错误',
      });
    }
    // 默认错误响应
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};
// 修改密码
// 修改密码 - 这个接口不需要操作 deptId，所以不需要修改
const upDatePsw = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json({ code: 401, data: null, msg: '请先登录' });
    }

    const { oldPassword, newPassword } = req.body;

    // 验证参数...
    if (!oldPassword?.trim()) {
      return res.status(200).json({ code: 400, data: null, msg: '旧密码不能为空' });
    }

    if (!newPassword?.trim()) {
      return res.status(200).json({ code: 400, data: null, msg: '新密码不能为空' });
    }

    if (oldPassword === newPassword) {
      return res.status(200).json({ code: 400, data: null, msg: '新密码不能与旧密码相同' });
    }

    if (newPassword.length < 6) {
      return res.status(200).json({ code: 400, data: null, msg: '新密码长度不能小于6位' });
    }

    // 查找用户 - deptId 字段会自动使用默认值
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      return res.status(200).json({ code: 404, data: null, msg: '用户不存在' });
    }

    // 验证旧密码
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(200).json({ code: 400, data: null, msg: '旧密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    // 增加token版本号
    await user.incrementTokenVersion();

    res.status(200).json({
      code: 200,
      data: {
        userId: user._id,
        username: user.username,
        account: user.account,
        message: '密码修改成功，请使用新密码重新登录',
      },
      msg: '密码修改成功',
    });
  } catch (error: any) {
    console.error('修改密码失败:', error);

    res.status(500).json({
      code: 500,
      data: null,
      msg: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误',
    });
  }
};
// 退出登录
const loginOut = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    // 1.获取userid
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json({
        code: 1000,
        msg: '用户未登录',
      });
    }
    // 2.使token失效
    const user = await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { returnDocument: 'after' });
    if (!user) {
      return res.status(200).json({
        code: 1000,
        msg: '用户不存在',
      });
    }
    res.status(200).json({ code: 200, msg: '退出登录成功' });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};
// 允许修改的字段常量
const ALLOWED_UPDATE_FIELDS = ['username', 'avatar', 'phone', 'email', 'department', 'employeeId'];

// 唯一字段检查配置
const UNIQUE_FIELDS = [
  { field: 'phone', message: '手机号已被其他用户使用' },
  { field: 'email', message: '邮箱已被其他用户使用' },
  { field: 'employeeId', message: '工号已被其他用户使用' },
];

// 修改用户信息
const upDateUserInfo = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    // 1. 获取用户ID
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(200).json({ code: 1000, msg: '请先登录' });
    }
    // 2. 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({
        code: 1000,
        msg: '数据验证失败',
        errors: errors.array().map((err: any) => ({ field: err.path, message: err.msg })),
      });
    }
    // 3. 过滤允许修改的字段
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
      return res.status(200).json({ code: 1000, msg: '没有提供可更新的字段' });
    }
    // 4. 批量检查唯一字段
    for (const { field, message } of UNIQUE_FIELDS) {
      if (updateData[field]) {
        const existingUser = await UserModel.findOne({
          [field]: updateData[field],
          _id: { $ne: userId },
        });

        if (existingUser) {
          return res.status(200).json({ code: 1000, msg: message });
        }
      }
    }
    // 5. 更新用户信息
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      {
        new: true,
        runValidators: true, // 注意这里是 runValidators，不是 renValidators
        returnDocument: 'after',
      }
    ).select('-password');
    if (!updatedUser) {
      return res.status(200).json({ code: 1000, msg: '用户不存在' });
    }
    // 7. 返回成功响应
    res.status(200).json({
      code: 200,
      msg: '用户信息修改成功',
      data: updatedUser,
    });
  } catch (error: any) {
    // 8. 错误处理
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ code: 400, msg: '数据验证失败', errors: messages });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'phone' ? '手机号' : field === 'email' ? '邮箱' : field;
      return res.status(409).json({ code: 409, msg: `${fieldName}已被使用` });
    }
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
};
export default {
  register,
  login,
  upDatePsw,
  loginOut,
  upDateUserInfo,
};
