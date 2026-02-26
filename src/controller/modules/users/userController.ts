import { UserModel } from '@/models/index.ts';
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
const loginOut = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  res.send('退出登录');
};
// 修改用户信息
const upDateUserInfo = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  res.send('修改用户信息');
};
export default {
  register,
  login,
  upDatePsw,
  loginOut,
  upDateUserInfo,
};
