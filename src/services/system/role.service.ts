import { Types } from 'mongoose';

import { DeptModel } from '@/models/system/dept/dept';
import { MenuModel } from '@/models/system/menu/menu';
import { RoleModel } from '@/models/system/role/role';
import { RoleDeptModel } from '@/models/system/roleDept/roleDept';
import { RoleMenuModel } from '@/models/system/roleMenu/roleMenu';
import { createAppError } from '@/utils/errorHandler.ts';

export class RoleService {
  /**
   * 获取角色列表（带数据权限过滤）
   */
  async getRoleList(query: any, dataScope?: any) {
    const { page = 1, limit = 10, keyword, status } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: any = { delFlag: { $ne: '1' } };

    if (keyword) {
      conditions.$or = [{ name: new RegExp(keyword as string, 'i') }, { label: new RegExp(keyword as string, 'i') }];
    }

    if (status !== undefined && status !== '') {
      conditions.status = status;
    }

    // 数据权限过滤：角色通常不需要部门级别的数据权限
    // 但可以添加基于创建人的权限控制
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      // 如果过滤器中有createdBy条件，应用到角色查询
      if (dataScope.filter.createdBy) {
        conditions.createdBy = dataScope.filter.createdBy;
      }
    }

    // 查询总数
    const total = await RoleModel.countDocuments(conditions);

    // 查询角色列表
    const roles = await RoleModel.find(conditions).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

    // 格式化角色数据
    const formattedRoles = roles.map((role) => ({
      id: role._id.toString(),
      name: role.name,
      label: role.label,
      dataScope: role.dataScope,
      status: role.status,
      remark: role.remark || '',
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return {
      list: formattedRoles,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    };
  }

  /**
   * 获取角色详情（带数据权限验证）
   */
  async getRoleDetail(id: string, dataScope?: any) {
    // 构建查询条件
    const conditions: any = { _id: id, delFlag: { $ne: '1' } };

    // 应用数据权限过滤
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      // 角色详情通常不需要部门ID过滤，但可以添加创建人权限控制
      if (dataScope.filter.createdBy) {
        conditions.createdBy = dataScope.filter.createdBy;
      }
    }

    const role = await RoleModel.findOne(conditions);
    if (!role) {
      throw createAppError('角色不存在或没有访问权限', { statusCode: 404 });
    }

    return {
      id: role._id.toString(),
      name: role.name,
      label: role.label,
      dataScope: role.dataScope,
      status: role.status,
      remark: role.remark || '',
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * 创建角色
   */
  async createRole(data: any) {
    const { name, label, dataScope = '5', status = '0', remark = '' } = data;

    // 检查角色名称是否已存在
    const existingRole = await RoleModel.findOne({ name, delFlag: { $ne: '1' } });
    if (existingRole) {
      throw createAppError('角色名称已存在', { statusCode: 409 });
    }

    // 创建角色
    const role = await RoleModel.create({
      name,
      label,
      dataScope,
      status,
      remark,
      delFlag: '0',
    });

    return {
      id: role._id.toString(),
      name: role.name,
      label: role.label,
      dataScope: role.dataScope,
      status: role.status,
      remark: role.remark,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, data: any) {
    const { name, label, dataScope, status, remark } = data;

    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: id, delFlag: { $ne: '1' } });
    if (!role) {
      throw createAppError('角色不存在', { statusCode: 404 });
    }

    // 如果修改了名称，检查是否与其他角色冲突
    if (name && name !== role.name) {
      const existingRole = await RoleModel.findOne({
        name,
        _id: { $ne: id },
        delFlag: { $ne: '1' },
      });
      if (existingRole) {
        throw createAppError('角色名称已存在', { statusCode: 409 });
      }
    }

    // 更新角色
    const updatedRole = await RoleModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name && { name }),
          ...(label && { label }),
          ...(dataScope && { dataScope }),
          ...(status && { status }),
          ...(remark !== undefined && { remark }),
        },
      },
      { returnDocument: 'after', runValidators: true }
    );

    return {
      id: updatedRole!._id.toString(),
      name: updatedRole!.name,
      label: updatedRole!.label,
      dataScope: updatedRole!.dataScope,
      status: updatedRole!.status,
      remark: updatedRole!.remark || '',
      createdAt: updatedRole!.createdAt,
      updatedAt: updatedRole!.updatedAt,
    };
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string) {
    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: id, delFlag: { $ne: '1' } });
    if (!role) {
      throw createAppError('角色不存在', { statusCode: 404 });
    }

    // 软删除角色
    await RoleModel.findByIdAndUpdate(id, { $set: { delFlag: '1' } });

    return { success: true };
  }

  /**
   * 获取所有角色（用于下拉选择，带数据权限过滤）
   */
  async getAllRoles(dataScope?: any) {
    // 构建查询条件
    const conditions: any = { delFlag: { $ne: '1' }, status: '0' };

    // 应用数据权限过滤
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      // 角色列表可以基于创建人过滤
      if (dataScope.filter.createdBy) {
        conditions.createdBy = dataScope.filter.createdBy;
      }
    }

    const roles = await RoleModel.find(conditions).sort({ createdAt: -1 }).select('name label');

    return roles.map((role) => ({
      id: role._id.toString(),
      name: role.name,
      label: role.label,
    }));
  }

  /**
   * 获取角色菜单树
   */
  async getRoleMenuTree() {
    const menus = await MenuModel.find({ delFlag: { $ne: '1' } })
      .sort({ orderNum: 1 })
      .select('name path component icon orderNum parentId');

    // 构建树形结构
    const menuTree = this.buildMenuTree(menus);

    return menuTree;
  }

  /**
   * 获取角色部门树
   */
  async getRoleDeptTree() {
    const depts = await DeptModel.find({ delFlag: { $ne: '1' } })
      .sort({ orderNum: 1 })
      .select('name orderNum parentId');

    // 构建树形结构
    const deptTree = this.buildDeptTree(depts);

    return deptTree;
  }

  /**
   * 获取角色已分配的菜单
   */
  async getRoleMenus(roleId: string) {
    const roleMenus = await RoleMenuModel.find({ roleId }).populate('menuId', 'name path component icon orderNum parentId').select('menuId');

    return roleMenus.map((rm) => rm.menuId?._id.toString()).filter(Boolean);
  }

  /**
   * 获取角色已分配的部门
   */
  async getRoleDepts(roleId: string) {
    const roleDepts = await RoleDeptModel.find({ roleId }).populate('deptId', 'name orderNum parentId').select('deptId');

    return roleDepts.map((rd) => rd.deptId?._id.toString()).filter(Boolean);
  }

  /**
   * 分配角色菜单
   */
  async assignRoleMenus(roleId: string, menuIds: string[]) {
    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: roleId, delFlag: { $ne: '1' } });
    if (!role) {
      throw createAppError('角色不存在', { statusCode: 404 });
    }

    // 删除原有的菜单分配
    await RoleMenuModel.deleteMany({ roleId });

    // 添加新的菜单分配
    if (menuIds.length > 0) {
      const roleMenus = menuIds.map((menuId) => ({
        roleId: new Types.ObjectId(roleId),
        menuId: new Types.ObjectId(menuId),
      }));
      await RoleMenuModel.insertMany(roleMenus);
    }

    return { success: true };
  }

  /**
   * 分配角色部门
   */
  async assignRoleDepts(roleId: string, deptIds: string[]) {
    // 检查角色是否存在
    const role = await RoleModel.findOne({ _id: roleId, delFlag: { $ne: '1' } });
    if (!role) {
      throw createAppError('角色不存在', { statusCode: 404 });
    }

    // 删除原有的部门分配
    await RoleDeptModel.deleteMany({ roleId });

    // 添加新的部门分配
    if (deptIds.length > 0) {
      const roleDepts = deptIds.map((deptId) => ({
        roleId: new Types.ObjectId(roleId),
        deptId: new Types.ObjectId(deptId),
      }));
      await RoleDeptModel.insertMany(roleDepts);
    }

    return { success: true };
  }

  /**
   * 构建菜单树
   */
  private buildMenuTree(menus: any[], parentId: string | null = null): any[] {
    const tree: any[] = [];

    menus.forEach((menu) => {
      const menuParentId = menu.parentId?.toString() || null;
      if (menuParentId === parentId) {
        const children = this.buildMenuTree(menus, menu._id.toString());
        tree.push({
          id: menu._id.toString(),
          name: menu.name,
          path: menu.path,
          component: menu.component,
          icon: menu.icon,
          orderNum: menu.orderNum,
          parentId: menuParentId,
          children: children.length > 0 ? children : undefined,
        });
      }
    });

    return tree;
  }

  /**
   * 构建部门树
   */
  private buildDeptTree(depts: any[], parentId: string | null = null): any[] {
    const tree: any[] = [];

    depts.forEach((dept) => {
      const deptParentId = dept.parentId?.toString() || null;
      if (deptParentId === parentId) {
        const children = this.buildDeptTree(depts, dept._id.toString());
        tree.push({
          id: dept._id.toString(),
          name: dept.name,
          orderNum: dept.orderNum,
          parentId: deptParentId,
          children: children.length > 0 ? children : undefined,
        });
      }
    });

    return tree;
  }
}
