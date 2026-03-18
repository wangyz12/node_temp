import { addMenu } from './addMenu.ts';
import { delMenu, findMenu } from './delMenu.ts';
import { updateMenu } from './updateMenu.ts';

// RESTful风格的更新菜单方法
const updateMenuRest = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    
    // 检查ID是否有效
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ code: 400, msg: '菜单ID无效' });
    }
    
    // 将参数从params移到body，以便现有的updateMenu方法可以处理
    req.body.id = id;
    return updateMenu(req, res);
  } catch (error) {
    console.error('RESTful更新菜单失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
};

// RESTful风格的删除菜单方法
const deleteMenuRest = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { id } = req.params;
    
    // 检查ID是否有效
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ code: 400, msg: '菜单ID无效' });
    }
    
    // 将参数从params移到body，以便现有的delMenu方法可以处理
    req.body.id = id;
    return delMenu(req, res);
  } catch (error) {
    console.error('RESTful删除菜单失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
};

// 获取所有菜单（简单列表）
const getAllMenus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    // 直接调用现有的findMenu方法
    return findMenu(req, res);
  } catch (error) {
    console.error('获取所有菜单失败:', error);
    res.status(500).json({ code: 500, msg: '服务器错误' });
  }
};

export default {
  addMenu,
  updateMenu,
  delMenu,
  findMenu,
  updateMenuRest,
  deleteMenuRest,
  getAllMenus,
};
