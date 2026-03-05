import { MenuModel } from '@/models/index.ts';
// 添加菜单
export const addMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { name, path, component, title, icon, sort, pid, type, hidden, cache, permissions, external, target } = req.body;
    // 1. 基础验证
    if (!name || !path || !component || !title) {
      return res.status(200).json({
        code: 1000,
        msg: '缺少必填字段：name、path、component、title 不能为空',
      });
    }
    // 2. 检查路由名称是否已存在
    const existingRoute = await MenuModel.findOne({ name });
    if (existingRoute) {
      return res.status(200).json({
        code: 1000,
        msg: '路由名称已存在',
      });
    }
    // 3. 如果传了 pid，检查父级是否存在
    if (pid) {
      const parentRoute = await MenuModel.findById(pid);
      if (!parentRoute) {
        return res.status(200).json({
          code: 1000,
          msg: '父级路由不存在',
        });
      }
    }
    // 4. 构建菜单数据
    const menuData: any = {
      name,
      path,
      component,
      title,
      icon: icon || '',
      sort: sort || 0,
      type: type || 'menu',
      hidden: hidden || false,
      cache: cache !== undefined ? cache : true,
      permissions: permissions || [],
      external: external || false,
      target: target || '_self',
    };
    // 如果有 pid，添加到数据中
    if (pid) {
      menuData.pid = pid;
    }
    // 5. 创建菜单
    const menu = await MenuModel.create(menuData);
    // 6. 返回成功响应
    res.status(200).json({
      code: 200,
      msg: '菜单添加成功',
      data: menu,
    });
  } catch (error: any) {
    // 处理唯一索引冲突
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        code: 409,
        msg: `${field === 'name' ? '路由名称' : field}已存在`,
      });
    }

    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        code: 400,
        msg: '数据验证失败',
        errors: messages,
      });
    }
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};
