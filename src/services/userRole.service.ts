// src/services/userRole.service.ts
import mongoose, { Types } from 'mongoose';

import { DeptModel } from '@/models/dept/dept';
import { MenuModel } from '@/models/menu/menu';
import { RoleModel } from '@/models/role/role';
import { RoleDeptModel } from '@/models/roleDept/roleDept';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu';
import { UserRoleModel } from '@/models/userRole/userRole';
import { UserModel } from '@/models/users/users';

export class UserRoleService {
  /**
   * 为用户分配角色
   */
  async assignRolesToUser(userId: string, roleIds: string[]) {
    // 检查用户是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查角色是否存在
    const roles = await RoleModel.find({ _id: { $in: roleIds }, delFlag: '0', status: '0' });
    if (roles.length !== roleIds.length) {
      throw new Error('部分角色不存在或已停用');
    }

    // 删除用户原有的角色关联
    await UserRoleModel.deleteMany({ userId: new Types.ObjectId(userId) });

    // 创建新的角色关联
    if (roleIds.length > 0) {
      const userRoleDocs = roleIds.map((roleId) => ({
        userId: new Types.ObjectId(userId),
        roleId: new Types.ObjectId(roleId),
      }));
      await UserRoleModel.insertMany(userRoleDocs);
    }

    return { userId, roleIds };
  }

  /**
   * 获取用户的角色列表
   */
  async getUserRoles(userId: string) {
    const userRoles = await UserRoleModel.find({ userId })
      .populate({
        path: 'roleId',
        select: 'name label dataScope status',
        transform: (doc) => {
          if (doc) {
            return {
              id: doc._id.toString(),
              name: doc.name,
              label: doc.label,
              dataScope: doc.dataScope,
              status: doc.status,
            };
          }
          return doc;
        },
      })
      .lean();

    return userRoles.map((ur) => ur.roleId).filter(Boolean);
  }

  /**
   * 获取用户的角色ID列表
   */
  async getUserRoleIds(userId: string): Promise<string[]> {
    const userRoles = await UserRoleModel.find({ userId }).select('roleId');
    return userRoles.map((ur) => ur.roleId.toString());
  }

  /**
   * 获取用户的菜单权限（基于角色）- 返回树形结构
   */
  async getUserMenus(userId: string) {
    try {
      console.log(`🔍 获取用户菜单，用户ID: ${userId}`);

      // 获取用户的角色ID
      const userRoles = await UserRoleModel.find({ userId });
      const roleIds = userRoles.map((ur) => ur.roleId.toString());
      console.log(`用户角色ID: ${roleIds.join(', ')}`);

      if (roleIds.length === 0) {
        console.log('⚠️ 用户没有分配任何角色');
        return [];
      }

      // 获取角色关联的菜单ID
      const roleMenus = await RoleMenuModel.find({
        roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });

      const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId.toString()))];
      console.log(`关联的菜单ID: ${menuIds.length} 个`, menuIds);

      if (menuIds.length === 0) {
        console.log('⚠️ 角色没有关联任何菜单');
        return [];
      }
      // 获取菜单详情（包括所有需要的字段）
      const menus = await MenuModel.find({
        _id: { $in: menuIds.map((id) => new mongoose.Types.ObjectId(id)) },
        status: '0',
      })
        .select('name path component icon order pid type permission title hidden cache external target')
        .sort({ order: 1 })
        .lean();

      console.log(`找到 ${menus.length} 个启用状态的菜单`, menus);

      // 转换菜单格式并构建树形结构
      const menuList = menus.map((menu: any) => ({
        id: menu._id.toString(),
        name: menu.name,
        path: menu.path,
        component: menu.component,
        icon: menu.icon,
        order: menu.order,
        parentId: menu.pid ? menu.pid.toString() : null,
        type: menu.type,
        perms: menu.permission, // 兼容性字段
        permission: menu.permission, // 标准字段
        title: menu.title,
        hidden: menu.hidden || false,
        cache: menu.cache !== undefined ? menu.cache : true,
        external: menu.external || false,
        target: menu.target || '_self',
        children: [] as any[],
      }));

      // 构建树形结构
      const menuTree = this.buildMenuTree(menuList);
      console.log(`构建了 ${menuTree.length} 个顶级菜单`);

      return menuTree;
    } catch (error) {
      console.error('❌ 获取用户菜单失败:', error);
      return [];
    }
  }

  /**
   * 构建菜单树形结构
   */
  private buildMenuTree(menus: any[]): any[] {
    // 创建菜单映射
    const menuMap = new Map<string, any>();
    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // 构建树形结构
    const tree: any[] = [];

    menus.forEach((menu) => {
      const menuItem = menuMap.get(menu.id);
      if (menu.parentId && menuMap.has(menu.parentId)) {
        // 添加到父菜单的children中
        const parent = menuMap.get(menu.parentId);
        parent.children.push(menuItem);
        parent.children.sort((a: any, b: any) => a.order - b.order);
      } else {
        // 顶级菜单
        tree.push(menuItem);
      }
    });

    // 按order排序顶级菜单
    tree.sort((a, b) => a.order - b.order);

    return tree;
  }

  /**
   * 获取用户的权限标识列表
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    // 获取用户的角色ID
    const userRoles = await UserRoleModel.find({ userId });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return [];
    }

    // 获取角色关联的菜单ID
    const roleMenus = await RoleMenuModel.find({ roleId: { $in: roleIds } });
    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length === 0) {
      return [];
    }

    // 获取菜单的权限标识
    const menus = await MenuModel.find({ _id: { $in: menuIds }, status: '0', permission: { $ne: '' } })
      .select('permission')
      .lean();

    const permissions = new Set<string>();
    menus.forEach((menu: any) => {
      if (menu.permission) {
        menu.permission.split(',').forEach((perm) => {
          if (perm.trim()) {
            permissions.add(perm.trim());
          }
        });
      }
    });

    return Array.from(permissions);
  }

  /**
   * 获取用户的数据权限范围
   */
  async getUserDataScope(userId: string): Promise<{ deptIds: string[]; dataScope: string }> {
    // 获取用户的角色ID
    const userRoles = await UserRoleModel.find({ userId });
    const roleIds = userRoles.map((ur) => ur.roleId);

    if (roleIds.length === 0) {
      return { deptIds: [], dataScope: '5' }; // 默认无数据权限
    }

    // 获取角色信息
    const roles = await RoleModel.find({ _id: { $in: roleIds }, delFlag: '0', status: '0' })
      .select('dataScope')
      .lean();

    if (roles.length === 0) {
      return { deptIds: [], dataScope: '5' };
    }

    // 取最高数据权限（数字越小权限越大）
    const dataScope = Math.min(...roles.map((r) => parseInt(r.dataScope || '5')).filter((n) => !isNaN(n))).toString();

    // 根据数据权限获取部门ID
    let deptIds: string[] = [];
    const user = await UserModel.findById(userId).select('deptId');
    const userDeptId: any = user?.deptId;

    if (dataScope === '1') {
      // 全部数据权限
      const allDepts = await DeptModel.find({ delFlag: '0', status: '0' }).select('_id');
      deptIds = allDepts.map((d) => d._id.toString());
    } else if (dataScope === '2') {
      // 本部门及以下数据权限
      if (userDeptId) {
        const deptAndChildren = await this.getDeptAndChildren(userDeptId);
        deptIds = deptAndChildren.map((d) => d._id.toString());
      }
    } else if (dataScope === '3') {
      // 本部门数据权限
      if (userDeptId) {
        deptIds = [userDeptId];
      }
    } else if (dataScope === '4') {
      // 自定义数据权限
      const roleDepts = await RoleDeptModel.find({ roleId: { $in: roleIds } });
      deptIds = [...new Set(roleDepts.map((rd) => rd.deptId.toString()))];
    }
    // dataScope === '5' 仅本人数据权限，deptIds为空

    return { deptIds, dataScope };
  }

  /**
   * 递归获取部门及其所有子部门
   */
  private async getDeptAndChildren(deptId: string): Promise<any[]> {
    const dept = await DeptModel.findById(deptId);
    if (!dept) {
      return [];
    }

    const result = [dept];
    const children = await DeptModel.find({ parentId: deptId, delFlag: '0', status: '0' });

    for (const child of children) {
      const grandchildren = await this.getDeptAndChildren(child._id.toString());
      result.push(...grandchildren);
    }

    return result;
  }

  /**
   * 检查用户是否拥有指定权限
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * 获取用户及其角色信息
   */
  async getUserWithRoles(userId: string) {
    const user = await UserModel.findById(userId).select('-password');
    if (!user) {
      throw new Error('用户不存在');
    }

    const roles = await this.getUserRoles(userId);
    const permissions = await this.getUserPermissions(userId);
    const dataScope = await this.getUserDataScope(userId);

    return {
      user: {
        id: user._id.toString(),
        account: user.account,
        username: user.username,
        phone: user.phone,
        email: user.email,
        deptId: user.deptId,
        status: user.status,
      },
      roles,
      permissions,
      dataScope,
    };
  }

  /**
   * 批量更新用户角色
   */
  async batchUpdateUserRoles(userIds: string[], roleIds: string[]) {
    // 检查所有用户是否存在
    const users = await UserModel.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      throw new Error('部分用户不存在');
    }

    // 检查角色是否存在
    const roles = await RoleModel.find({ _id: { $in: roleIds }, delFlag: '0', status: '0' });
    if (roles.length !== roleIds.length) {
      throw new Error('部分角色不存在或已停用');
    }

    // 为每个用户分配角色
    const results = [];
    for (const userId of userIds) {
      await this.assignRolesToUser(userId, roleIds);
      results.push({ userId, roleIds });
    }

    return results;
  }

  /**
   * 移除用户的角色
   */
  async removeRoleFromUser(userId: string, roleId: string) {
    // 检查用户是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: roleId, delFlag: '0', status: '0' });
    if (!role) {
      throw new Error('角色不存在或已停用');
    }

    // 删除角色关联
    const result = await UserRoleModel.deleteOne({
      userId: new Types.ObjectId(userId),
      roleId: new Types.ObjectId(roleId),
    });

    if (result.deletedCount === 0) {
      throw new Error('用户没有该角色');
    }

    return { userId, roleId };
  }

  /**
   * 批量操作用户角色
   */
  async batchUserRoleOperation(userId: string, addRoleIds: string[], removeRoleIds: string[]) {
    // 检查用户是否存在
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查要添加的角色是否存在
    if (addRoleIds.length > 0) {
      const addRoles = await RoleModel.find({ _id: { $in: addRoleIds }, delFlag: '0', status: '0' });
      if (addRoles.length !== addRoleIds.length) {
        throw new Error('部分要添加的角色不存在或已停用');
      }
    }

    // 检查要移除的角色是否存在
    if (removeRoleIds.length > 0) {
      const removeRoles = await RoleModel.find({ _id: { $in: removeRoleIds }, delFlag: '0', status: '0' });
      if (removeRoles.length !== removeRoleIds.length) {
        throw new Error('部分要移除的角色不存在或已停用');
      }
    }

    // 添加新角色
    if (addRoleIds.length > 0) {
      const userRoleDocs = addRoleIds.map((roleId) => ({
        userId: new Types.ObjectId(userId),
        roleId: new Types.ObjectId(roleId),
      }));
      await UserRoleModel.insertMany(userRoleDocs);
    }

    // 移除指定角色
    if (removeRoleIds.length > 0) {
      await UserRoleModel.deleteMany({
        userId: new Types.ObjectId(userId),
        roleId: { $in: removeRoleIds.map((id) => new Types.ObjectId(id)) },
      });
    }

    return { userId, added: addRoleIds, removed: removeRoleIds };
  }

  /**
   * 获取角色下的用户列表
   */
  async getRoleUsers(roleId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: roleId, delFlag: '0', status: '0' });
    if (!role) {
      throw new Error('角色不存在或已停用');
    }

    // 获取角色关联的用户总数
    const total = await UserRoleModel.countDocuments({ roleId: new Types.ObjectId(roleId) });

    // 获取角色关联的用户列表
    const userRoles = await UserRoleModel.find({ roleId: new Types.ObjectId(roleId) })
      .populate({
        path: 'userId',
        select: 'account username phone email deptId status',
        transform: (doc) => {
          if (doc) {
            return {
              id: doc._id.toString(),
              account: doc.account,
              username: doc.username,
              phone: doc.phone,
              email: doc.email,
              deptId: doc.deptId,
              status: doc.status,
            };
          }
          return doc;
        },
      })
      .skip(skip)
      .limit(limit)
      .lean();

    const users = userRoles.map((ur) => ur.userId).filter(Boolean);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 检查用户是否拥有指定角色
   */
  async checkUserHasRole(userId: string, roleId: string): Promise<boolean> {
    const userRole = await UserRoleModel.findOne({
      userId: new Types.ObjectId(userId),
      roleId: new Types.ObjectId(roleId),
    });

    return !!userRole;
  }
}

export default new UserRoleService();
