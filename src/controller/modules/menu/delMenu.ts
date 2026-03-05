import { MenuModel } from '@/models/index.ts';
// 删除菜单
export const delMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // 1 判断id是否存在
    const { id } = req.body;
    if (!id) {
      return res.status(200).json({ code: 1000, msg: '缺少id' });
    }
    // 2 查找并删除
    const result = await MenuModel.findOneAndDelete({ _id: id });
    if (!result) {
      return res.status(200).json({ code: 1000, msg: '菜单不存在' });
    }
    //getFullTree

    res.status(200).json({ code: 200, msg: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ code: 1000, msg: error });
  }
};

// 查询
export const findMenu = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const menuTree = await MenuModel.getFullTree();
    res.status(200).json({
      code: 200,
      msg: '获取成功',
      data: menuTree,
    });
  } catch (error: any) {
    res.status(500).json({ code: 1000, msg: error });
  }
};
