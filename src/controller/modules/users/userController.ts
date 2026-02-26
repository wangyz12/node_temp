import { UserModel } from '@/models/index.ts';
import { jwtUtil } from '@/utils/jwt.ts';
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
const upDatePsw = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  res.send('修改密码');
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
