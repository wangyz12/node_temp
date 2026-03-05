import { MenuModel } from '@/models/index.ts';
// 修改菜单
export const updateMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const obj = req.body;
    const { name, path, component, title } = req.body;
    if (!name || !path || !component || !title) {
      return res.status(200).json({
        code: 1000,
        msg: '缺少必填字段：name、path、component、title、 不能为空',
      });
    }
    if (!obj.id) {
      return res.status(200).json({ code: 1000, msg: '缺少必要的id' });
    }
    const { id, ...updateData } = obj; // 解构出 id 和其他字段
    const result = await MenuModel.findByIdAndUpdate(id, updateData);
    if (!result) {
      return res.status(200).json({ code: 1000, msg: '更新失败' });
    }
    res.status(200).json({ code: 200, msg: '更新成功' });
  } catch (error: any) {
    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        code: 400,
        msg: '数据验证失败',
        errors: messages,
      });
    }
  }
};
