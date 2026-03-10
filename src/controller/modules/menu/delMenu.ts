import { MenuModel } from '@/models/index.js';
/**
 * 删除菜单
 * 需要检查是否有子菜单，避免删除父级导致数据混乱
 */
export const delMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // 1. 从 params 获取 id（RESTful规范）
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        code: 400,
        msg: '菜单ID不能为空',
      });
    }
    // 2. 检查是否存在子菜单
    const childrenCount = await MenuModel.countDocuments({ pid: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        code: 400,
        msg: '请先删除子菜单',
      });
    }
    // 3. 查找并删除
    const result = await MenuModel.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        code: 404,
        msg: '菜单不存在',
      });
    }
    res.status(200).json({
      code: 200,
      msg: '删除成功',
    });
  } catch (error: any) {
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};

/**
 * 查询菜单树
 * 支持按类型过滤
 */
export const findMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { type } = req.query; // 可选：menu, button, iframe

    // 获取完整菜单树
    let menuTree = await MenuModel.getFullTree();

    // 如果指定了类型，进行过滤
    if (type) {
      // 递归过滤函数
      const filterByType = (menus: any[]): any[] => {
        return menus
          .filter((menu) => menu.type === type)
          .map((menu) => ({
            ...menu,
            children: menu.children ? filterByType(menu.children) : [],
          }))
          .filter((menu) => menu.children.length > 0 || menu.type === type);
      };

      menuTree = filterByType(menuTree);
    }

    res.status(200).json({
      code: 200,
      msg: '获取成功',
      data: menuTree,
    });
  } catch (error: any) {
    logger.error('查询菜单失败:', error);
    res.status(500).json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
};
