import { UserModel } from '@/models/index.ts';
// 第一种参数直接赋类型
async function query(req: ExpressRequest, res: ExpressResponse, next: ExpressNext) {
  try {
    // 直接从请求体创建用户
    const user = await UserModel.create(req.body);
    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    // 处理重复邮箱错误
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册',
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
}
// 第二种剪头函数式声明类型
const createUser: AsyncController = async (req, res) => {
  // 业务逻辑
  res.json({ success: true });
};
export default {
  query,
};
