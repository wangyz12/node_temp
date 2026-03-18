// src/controller/modules/role/roleController.ts
import { Types } from 'mongoose';

import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';
import { RoleModel } from '@/models/role/role.ts';
import { RoleDeptModel } from '@/models/roleDept/roleDept.ts';
import { RoleMenuModel } from '@/models/roleMenu/roleMenu.ts';

export class RoleController {
  /**
   * 获取角色列表
   */
  async getRoleList(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { page = 1, limit = 10, keyword, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 构建查询条件 - 使用更简单的逻辑
      const conditions: any = {};
      
      // 只查询未删除的角色
      conditions.delFlag = { $ne: '1' };

      if (keyword) {
        conditions.$or = [
          { name: new RegExp(keyword as string, 'i') },
          { label: new RegExp(keyword as string, 'i') }
        ];
      }

      if (status !== undefined && status !== '') {
        conditions.status = status;
      }

      // 查询总数
      const total = await RoleModel.countDocuments(conditions);

      // 查询角色列表
      const roles = await RoleModel.find(conditions).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

      // 格式化角色数据，将 _id 转换为 id
      const formattedRoles = roles.map(role => ({
        id: role._id.toString(),
        name: role.name,
        label: role.label,
        dataScope: role.dataScope,
        status: role.status,
        remark: role.remark || '',
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }));

      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: formattedRoles,
          total, // 添加total字段到根级别，兼容前端
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色详情
   */
  async getRoleDetail(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 获取角色关联的菜单权限
      const roleMenus = await RoleMenuModel.find({ roleId: id });
      const menuIds = roleMenus.map((rm) => rm.menuId.toString());

      // 获取角色关联的部门权限（数据权限）
      const roleDepts = await RoleDeptModel.find({ roleId: id });
      const deptIds = roleDepts.map((rd) => rd.deptId.toString());

      res.json({
        code: 200,
        msg: 'success',
        data: {
          ...role.toObject(),
          menuIds,
          deptIds,
        },
      });
    } catch (error) {
      console.error('获取角色详情失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 创建角色
   */
  async createRole(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { name, label, dataScope, status, remark, menuIds, deptIds } = req.body;

      // 检查角色名称是否已存在
      const existingRole = await RoleModel.findOne({ name });
      if (existingRole) {
        return res.status(409).json({ code: 409, msg: '角色名称已存在' });
      }

      // 创建角色
      const role = await RoleModel.create({
        name,
        label,
        dataScope: dataScope || '3',
        status: status || '0',
        remark,
      });

      // 分配菜单权限
      if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
        const roleMenuDocs = menuIds.map((menuId) => ({
          roleId: role._id,
          menuId: new Types.ObjectId(menuId),
        }));
        await RoleMenuModel.insertMany(roleMenuDocs);
      }

      // 分配部门权限（数据权限）
      if (deptIds && Array.isArray(deptIds) && deptIds.length > 0 && dataScope === '2') {
        const roleDeptDocs = deptIds.map((deptId) => ({
          roleId: role._id,
          deptId: new Types.ObjectId(deptId),
        }));
        await RoleDeptModel.insertMany(roleDeptDocs);
      }

      res.status(201).json({
        code: 201,
        msg: '创建成功',
        data: role,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ code: 409, msg: '角色名称已存在' });
      }
      console.error('创建角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 更新角色
   */
  async updateRole(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;
      const { name, label, dataScope, status, remark, menuIds, deptIds } = req.body;
      
      // 类型断言，确保id是字符串
      const roleId = id as string;

      // 检查角色是否存在
      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 检查角色名称是否与其他角色冲突
      if (name && name !== role.name) {
        const existingRole = await RoleModel.findOne({ name, _id: { $ne: new Types.ObjectId(roleId) } });
        if (existingRole) {
          return res.status(409).json({ code: 409, msg: '角色名称已存在' });
        }
      }

      // 更新角色基本信息
      const updateData: any = {};
      if (name) updateData.name = name;
      if (label) updateData.label = label;
      if (dataScope) updateData.dataScope = dataScope;
      if (status !== undefined) updateData.status = status;
      if (remark !== undefined) updateData.remark = remark;

      const updatedRole = await RoleModel.findByIdAndUpdate(roleId, { $set: updateData }, { new: true, runValidators: true });

      // 更新菜单权限
      if (menuIds && Array.isArray(menuIds)) {
        // 删除旧的菜单权限
        await RoleMenuModel.deleteMany({ roleId: roleId });

        // 添加新的菜单权限
        if (menuIds.length > 0) {
          const roleMenuDocs = menuIds.map((menuId) => ({
            roleId: new Types.ObjectId(roleId),
            menuId: new Types.ObjectId(menuId),
          }));
          await RoleMenuModel.insertMany(roleMenuDocs);
        }
      }

      // 更新部门权限
      if (deptIds && Array.isArray(deptIds)) {
        // 删除旧的部门权限
        await RoleDeptModel.deleteMany({ roleId: roleId });

        // 添加新的部门权限
        if (deptIds.length > 0 && (dataScope === '2' || updateData.dataScope === '2')) {
          const roleDeptDocs = deptIds.map((deptId) => ({
            roleId: new Types.ObjectId(roleId),
            deptId: new Types.ObjectId(deptId),
          }));
          await RoleDeptModel.insertMany(roleDeptDocs);
        }
      }

      res.json({
        code: 200,
        msg: '更新成功',
        data: updatedRole,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ code: 409, msg: '角色名称已存在' });
      }
      console.error('更新角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 删除角色
   */
  async deleteRole(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      // 检查角色是否存在
      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 软删除：标记为已删除
      await RoleModel.findByIdAndUpdate(id, { delFlag: '1' });

      // 删除角色关联的权限
      await RoleMenuModel.deleteMany({ roleId: id });
      await RoleDeptModel.deleteMany({ roleId: id });

      res.json({
        code: 200,
        msg: '删除成功',
      });
    } catch (error) {
      console.error('删除角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取所有角色（用于下拉选择）
   */
  async getAllRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const roles = await RoleModel.find({ 
        delFlag: { $ne: '1' },
        status: '0' 
      }).select('_id name label').sort({ createdAt: 1 });

      // 格式化响应数据，将 _id 转换为 id
      const formattedRoles = roles.map(role => ({
        id: role._id.toString(),
        name: role.name,
        label: role.label
      }));

      res.json({
        code: 200,
        msg: 'success',
        data: formattedRoles,
      });
    } catch (error) {
      console.error('获取所有角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色关联的菜单树
   */
  async getRoleMenuTree(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;

      // 获取所有菜单（树形结构）
      const allMenus = await MenuModel.getFullTree();

      // 获取角色已分配的菜单ID
      const roleMenus = await RoleMenuModel.find({ roleId });
      const assignedMenuIds = new Set(roleMenus.map((rm) => rm.menuId.toString()));

      // 标记已分配的菜单
      const markAssigned = (menus: any[]): any[] => {
        return menus.map((menu) => {
          const isAssigned = assignedMenuIds.has(menu.id);
          const children: any[] = menu.children ? markAssigned(menu.children) : [];

          return {
            ...menu,
            checked: isAssigned,
            children,
          };
        });
      };

      const menuTree = markAssigned(allMenus);

      res.json({
        code: 200,
        msg: 'success',
        data: menuTree,
      });
    } catch (error) {
      console.error('获取角色菜单树失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色关联的部门树
   */
  async getRoleDeptTree(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;

      // 获取所有部门（树形结构）
      const allDepts = await DeptModel.find({ delFlag: '0' });

      // 构建部门树
      const buildDeptTree = (parentId: string | null = null): any[] => {
        return allDepts
          .filter((dept) => {
            if (parentId === null) return !dept.parentId;
            return dept.parentId?.toString() === parentId;
          })
          .map((dept) => {
            const children: any[] = buildDeptTree(dept._id.toString());
            return {
              id: dept._id.toString(),
              label: dept.name,
              children: children.length > 0 ? children : undefined,
            };
          });
      };

      const deptTree = buildDeptTree();

      // 获取角色已分配的部门ID
      const roleDepts = await RoleDeptModel.find({ roleId });
      const assignedDeptIds = new Set(roleDepts.map((rd) => rd.deptId.toString()));

      // 标记已分配的部门
      const markAssigned = (depts: any[]): any[] => {
        return depts.map((dept) => {
          const isAssigned = assignedDeptIds.has(dept.id);
          const children: any[] = dept.children ? markAssigned(dept.children) : [];

          return {
            ...dept,
            checked: isAssigned,
            children,
          };
        });
      };

      const markedDeptTree = markAssigned(deptTree);

      res.json({
        code: 200,
        msg: 'success',
        data: markedDeptTree,
      });
    } catch (error) {
      console.error('获取角色部门树失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色已分配的菜单ID列表
   */
  async getRoleMenus(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;

      const roleMenus = await RoleMenuModel.find({ roleId });
      const menuIds = roleMenus.map((rm) => rm.menuId.toString());

      res.json({
        code: 200,
        msg: 'success',
        data: menuIds,
      });
    } catch (error) {
      console.error('获取角色菜单失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色已分配的部门ID列表
   */
  async getRoleDepts(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;

      const roleDepts = await RoleDeptModel.find({ roleId });
      const deptIds = roleDepts.map((rd) => rd.deptId.toString());

      res.json({
        code: 200,
        msg: 'success',
        data: deptIds,
      });
    } catch (error) {
      console.error('获取角色部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 分配角色菜单权限
   */
  async assignRoleMenus(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;
      const { menuIds } = req.body;
      
      // 类型断言
      const roleIdStr = roleId as string;

      // 检查角色是否存在
      const role = await RoleModel.findById(roleIdStr);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 删除旧的菜单权限
      await RoleMenuModel.deleteMany({ roleId: roleIdStr });

      // 添加新的菜单权限
      if (menuIds && Array.isArray(menuIds) && menuIds.length > 0) {
        const roleMenuDocs = menuIds.map((menuId) => ({
          roleId: new Types.ObjectId(roleIdStr),
          menuId: new Types.ObjectId(menuId),
        }));
        await RoleMenuModel.insertMany(roleMenuDocs);
      }

      res.json({
        code: 200,
        msg: '菜单分配成功',
      });
    } catch (error) {
      console.error('分配角色菜单失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 分配角色部门权限
   */
  async assignRoleDepts(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;
      const { deptIds } = req.body;
      
      // 类型断言
      const roleIdStr = roleId as string;

      // 检查角色是否存在
      const role = await RoleModel.findById(roleIdStr);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 删除旧的部门权限
      await RoleDeptModel.deleteMany({ roleId: roleIdStr });

      // 添加新的部门权限
      if (deptIds && Array.isArray(deptIds) && deptIds.length > 0) {
        const roleDeptDocs = deptIds.map((deptId) => ({
          roleId: new Types.ObjectId(roleIdStr),
          deptId: new Types.ObjectId(deptId),
        }));
        await RoleDeptModel.insertMany(roleDeptDocs);
      }

      res.json({
        code: 200,
        msg: '部门分配成功',
      });
    } catch (error) {
      console.error('分配角色部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }
}

export default new RoleController();
