import { UserModel } from '@/models/index.ts';
import { validationResult } from 'express-validator';
import { generateUserToken, generateUserTokenFromExisting } from '@/utils/userToken.ts';
// 注册
const register = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    logger.debug('创建用户请求', { body: req.body });
    // 直接从请求体创建用户
    const user = await UserModel.create(req.body);
    // 手动删除密码字段
    const tokenData = await generateUserToken(user);
    res.status(200).json({
      code: 200,
      msg: '用户创建成功',
      data: tokenData,
    });
    logger.success('用户创建成功', user);
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
const login = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    logger.debug('用户登录', { body: req.body.account });
    const { account, password } = req.body;
    const user: any = await UserModel.findOne({ account }).select('+password');
    const isPasswordValid = user.comparePassword(password);
    if (!user || !isPasswordValid) {
      logger.debug('用户名密码不正确', { account: req.body.account });
      return res.status(200).json({ code: 1000, data: null, msg: '用户名密码不正确' });
    }
    const tokenData = generateUserTokenFromExisting(user);
    res.status(200).json({
      code: 200,
      msg: '用户创建成功',
      data: tokenData,
    });
    logger.debug(`${req.body.account}用户登录成功`, { account: req.body.account });
  } catch (error: any) {
    logger.debug(`${req.body.account}用户登录失败`, error);
    return res.status(500).json({ code: 1000, data: null, msg: error });
  }
};
// 修改密码
const upDatePsw = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    // 1.是否登录
    const userId = req.user?.userId;
    if (!userId) {
      logger.error('修改密码失败', '未登录');
      return res.status(200).json({ code: 1000, data: null, msg: '请先登录' });
    }
    // 2.判断是否为空
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      logger.error('旧密码新密码为空', '');
      return res.status(200).json({ code: 1000, data: null, msg: '旧密码和新密码不能为空' });
    }
    // 3.判断是否相等
    if (oldPassword === newPassword) {
      logger.error('旧密码新密码相同', '');
      return res.status(200).json({ code: 1000, data: null, msg: '旧密码不能与新密码相同' });
    }
    // 4.获取用户的密码
    const user = await UserModel.findById(userId).select('+password');
    if (!user) {
      logger.error('用户不存在', '');
      return res.status(200).json({ code: 1000, data: null, msg: '用户不存在' });
    }
    // 5.判断旧密码是否相等
    const isPasswordValid = user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      logger.error('旧密码错误', '');
      return res.status(200).json({ code: 1000, data: null, msg: '旧密码错误' });
    }
    // 6.复制新密码
    user.password = newPassword;
    // 7.更新
    await user.save();
    // 8.token版本加1
    await user.incrementTokenVersion();
    logger.error('修改密码成功', '');
    res.status(200).json({
      code: 200,
      data: null,
      msg: '密码修改成功，请重新登录',
    });
  } catch (error: any) {
    logger.error('修改密码失败', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};
// 退出登录
const loginOut = async (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  try {
    // 1.获取userid
    const userId = req.user?.userId;
    if (!userId) {
      logger.error('退出登录接口用户未登录');
      return res.status(200).json({
        code: 1000,
        msg: '用户未登录',
      });
    }
    // 2.使token失效
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $inc: { tokenVersion: 1 } },
      { returnDocument: 'after' }
    );
    if (!user) {
      logger.error('退出登录接口用户未登录');
      return res.status(200).json({
        code: 1000,
        msg: '用户不存在',
      });
    }
    logger.success(`用户 ${user.account} 退出登录成功`, {
      userId: user._id,
    });
    res.status(200).json({ code: 200, msg: '退出登录成功' });
  } catch (error: any) {
    logger.error('退出登录失败', error);
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
      logger.warn('修改用户信息失败: 用户未登录');
      return res.status(200).json({ code: 1000, msg: '请先登录' });
    }
    // 2. 验证请求数据
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('修改用户信息失败: 数据验证未通过', { errors: errors.array() });
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
      logger.warn('修改用户信息失败: 没有提供可更新的字段', { body: req.body });
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
          logger.warn(`修改用户信息失败: ${message}`, { field, value: updateData[field] });
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
      logger.error('修改用户信息失败: 用户不存在', { userId });
      return res.status(200).json({ code: 1000, msg: '用户不存在' });
    }
    // 6. 记录成功日志
    logger.info(`用户 ${updatedUser.account} 修改信息成功`, {
      userId: updatedUser._id,
      updatedFields: Object.keys(updateData),
    });
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
      logger.warn('修改用户信息失败: 数据验证错误', { messages });
      return res.status(400).json({ code: 400, msg: '数据验证失败', errors: messages });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'phone' ? '手机号' : field === 'email' ? '邮箱' : field;
      logger.warn('修改用户信息失败: 唯一索引冲突', { field, value: error.keyValue?.[field] });
      return res.status(409).json({ code: 409, msg: `${fieldName}已被使用` });
    }
    logger.error('修改用户信息失败: 服务器内部错误', error);
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
