// src/services/menu.service.ts
import { MenuModel } from '@/models/system/menu/menu';

export class MenuService {
  /**
   * 获取菜单树
   */
  async getMenuTree(query: any = {}) {
    const { type } = query;

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

    return menuTree;
  }

  /**
   * 获取菜单详情
   */
  async getMenuDetail(id: string) {
    const menu = await MenuModel.findById(id);
    if (!menu) {
      throw new Error('菜单不存在');
    }
    return menu;
  }

  /**
   * 创建菜单
   */
  async createMenu(data: any) {
    const { name, path, component, title, icon, sort, pid, type, hidden, cache, permissions, external, target } = data;

    // 基础验证
    if (!name || !path || !component || !title) {
      throw new Error('缺少必填字段：name、path、component、title 不能为空');
    }

    // 检查路由名称是否已存在
    const existingRoute = await MenuModel.findOne({ name });
    if (existingRoute) {
      throw new Error('路由名称已存在');
    }

    // 如果传了 pid，检查父级是否存在
    if (pid) {
      const parentRoute = await MenuModel.findById(pid);
      if (!parentRoute) {
        throw new Error('父级路由不存在');
      }
    }

    // 构建菜单数据
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

    // 处理 pid 字段
    if (pid) {
      menuData.pid = pid;
    } else {
      // 如果 pid 是空字符串或未定义，设置为 null（表示顶级菜单）
      menuData.pid = null;
    }

    // 创建菜单
    const menu = await MenuModel.create(menuData);
    return menu;
  }

  /**
   * 更新菜单
   */
  async updateMenu(id: string, data: any) {
    const { name, path, component, title } = data;

    if (!name || !path || !component || !title) {
      throw new Error('缺少必填字段：name、path、component、title 不能为空');
    }

    // 处理 pid 字段：如果 pid 是空字符串，设置为 null（表示顶级菜单）
    const updateData = { ...data };
    if (updateData.pid === '') {
      updateData.pid = null;
    }

    const result = await MenuModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!result) {
      throw new Error('菜单不存在');
    }

    return result;
  }

  /**
   * 删除菜单
   */
  async deleteMenu(id: string) {
    // 检查是否存在子菜单
    const childrenCount = await MenuModel.countDocuments({ pid: id });
    if (childrenCount > 0) {
      throw new Error('请先删除子菜单');
    }

    // 查找并删除
    const result = await MenuModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('菜单不存在');
    }

    return result;
  }

  /**
   * 获取所有菜单（简单列表）
   */
  async getAllMenus() {
    const menus = await MenuModel.find().sort({ sort: 1 });
    return menus;
  }

  /**
   * 检查菜单是否存在
   */
  async checkMenuExists(id: string): Promise<boolean> {
    const menu = await MenuModel.findById(id);
    return !!menu;
  }

  /**
   * 获取菜单类型统计
   */
  async getMenuTypeStats() {
    const stats = await MenuModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    return stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});
  }
}

export default new MenuService();
