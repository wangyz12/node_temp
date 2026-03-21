// src/services/userRole.service.ts
import { Types } from 'mongoose';

import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';
import { RoleModel } from '@/models/role/role.ts';
import { RoleDeptModel } from '@/models/roleDept/roleDept.ts';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { UserModel } from '@/models/users/users.ts';

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
    const userRoles = await UserRoleModel.find({ userId }).populate({
      path: 'roleId',
      select: 'name label dataScope status',
      transform: (doc) => {
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            label: doc.label,
            dataScope: doc.dataScope,
            status: doc.status
          };
        }
        return doc;
      }
    }).lean();

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
   * 获取用户的菜单权限（基于角色）
   */
  async getUserMenus(userId: string) {
    console.log('📡 获取用户菜单权限，用户ID:', userId);

    // 获取用户的角色ID
    const userRoles = await UserRoleModel.find({ userId });
    const roleIds = userRoles.map((ur) => ur.roleId);
    console.log('👥 用户角色ID:', roleIds);

    if (roleIds.length === 0) {
      console.log('⚠️ 用户没有分配任何角色');
      return [];
    }

    // 获取角色关联的菜单ID
    const roleMenus = await RoleMenuModel.find({ roleId: { $in: roleIds } });
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId.toString()))];
    console.log('📋 角色关联的菜单ID:', menuIds);

    if (menuIds.length === 0) {
      console.log('⚠️ 角色没有分配任何菜单');
      return [];
    }

    // 获取菜单详情并构建树形结构
    const allMenus = await MenuModel.find({ _id: { $in: menuIds } }).sort('sort');
    console.log('📊 获取到的菜单数量:', allMenus.length);

    // 构建菜单树
    const buildMenuTree = (parentId: string | null = null): any[] => {
      return allMenus
        .filter((menu) => {
          if (parentId === null) return !menu.pid;
          return menu.pid?.toString() === parentId;
        })
        .map((menu) => {
          const children: any[] = buildMenuTree(menu._id.toString());
          return {
            ...menu.toObject(),
            children: children.length > 0 ? children : undefined,
          };
        });
    };

    const menuTree = buildMenuTree();
    console.log('🌳 构建的菜单树:', JSON.stringify(menuTree, null, 2));
    
    return menuTree;
  }

  /**
   * 获取用户的权限标识列表（用于按钮权限控制）
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
    const menus = await MenuModel.find({
      _id: { $in: menuIds },
      permission: { $exists: true, $ne: '' },
    }).select('permission');

    return menus.map((menu) => menu.permission!).filter(Boolean);
  }

  /**
   * 获取用户的数据权限（部门ID列表）
   */
  async getUserDataScope(userId: string): Promise<{ deptIds: string[]; dataScope: string }> {
    // 获取用户的角色
    const userRoles = await UserRoleModel.find({ userId }).populate({
      path: 'roleId',
      select: 'dataScope'
    });
    const roles = userRoles.map((ur) => ur.roleId);

    if (roles.length === 0) {
      return { deptIds: [], dataScope: '5' }; // 默认仅本人数据权限
    }

    // 获取最严格的数据权限
    const dataScopes = roles.map((role) => (role as any).dataScope);
    const dataScope = this.getStrictestDataScope(dataScopes);

    // 根据数据权限计算部门ID列表
    let deptIds: string[] = [];

    if (dataScope === '1') {
      // 全部数据权限 - 获取所有部门
      const allDepts = await DeptModel.find({ delFlag: '0' }).select('_id');
      deptIds = allDepts.map((dept) => dept._id.toString());
    } else if (dataScope === '2') {
      // 自定义数据权限 - 获取角色关联的部门
      const roleIds = roles.map((role) => (role as any)._id);
      const roleDepts = await RoleDeptModel.find({ roleId: { $in: roleIds } });
      deptIds = [...new Set(roleDepts.map((rd) => rd.deptId.toString()))];
    } else if (dataScope === '3') {
      // 本部门数据权限 - 获取用户所在部门
      const user = await UserModel.findById(userId).select('deptId');
      if (user?.deptId) {
        deptIds = [user.deptId.toString()];
      }
    } else if (dataScope === '4') {
      // 本部门及以下数据权限 - 获取用户所在部门及其所有子部门
      const user = await UserModel.findById(userId).select('deptId');
      if (user?.deptId) {
        const dept = await DeptModel.findById(user.deptId);
        if (dept) {
          // 查找所有祖先路径包含该部门的部门
          const childDepts = await DeptModel.find({
            ancestors: { $regex: `,${user.deptId.toString()},` },
            delFlag: '0',
          }).select('_id');
          deptIds = [user.deptId.toString(), ...childDepts.map((dept) => dept._id.toString())];
        }
      }
    }
    // dataScope === '5' 仅本人数据权限，deptIds 为空数组

    return { deptIds, dataScope };
  }

  /**
   * 获取最严格的数据权限
   * 优先级：5 > 4 > 3 > 2 > 1
   */
  private getStrictestDataScope(dataScopes: string[]): string {
    if (dataScopes.includes('5')) return '5';
    if (dataScopes.includes('4')) return '4';
    if (dataScopes.includes('3')) return '3';
    if (dataScopes.includes('2')) return '2';
    return '1'; // 默认全部数据权限
  }

  /**
   * 检查用户是否有某个权限
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * 获取用户详情（包含角色信息）
   */
  async getUserWithRoles(userId: string) {
    const user = await UserModel.findById(userId).populate({
      path: 'deptId',
      select: 'name code',
      transform: (doc) => {
        if (doc) {
          return {
            id: doc._id.toString(),
            name: doc.name,
            code: doc.code
          };
        }
        return doc;
      }
    }).select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户的角色
    const roles = await this.getUserRoles(userId);

    return {
      ...user.toObject(),
      roles,
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

    // 检查所有角色是否存在
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
}

export default new UserRoleService();
