import { MenuModel } from '@/models/index.ts';
// 修改菜单
export const updateMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const obj = req.body;
    const { name, path, component, title } = req.body;
    if (!name || !path || !component || !title) {
      return res.status(200).json({
        code: 1000,
        msg: '缺少必填字段：name、path、component、title 不能为空',
      });
    }
    if (!obj.id) {
      return res.status(200).json({ code: 1000, msg: '缺少必要的id' });
    }
    
    const { id, ...updateData } = obj; // 解构出 id 和其他字段
    
    // 处理 pid 字段：如果 pid 是空字符串，设置为 null（表示顶级菜单）
    if (updateData.pid === '') {
      updateData.pid = null;
    }
    
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
    // 处理其他错误
    console.error('更新菜单失败:', error);
    res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
};
