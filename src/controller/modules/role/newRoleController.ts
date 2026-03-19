// 重构的角色控制器 - 更简洁、更健壮
import { RoleModel } from '@/models/role/role.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { DeptModel } from '@/models/dept/dept.ts';
import { MenuModel } from '@/models/menu/menu.ts';

export class NewRoleController {
  /**
   * 获取角色列表（带分页）
   */
  async getRoleList(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { page = 1, limit = 10, keyword, status } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 构建查询条件 - 简化版，只查询未删除的
      const conditions: any = {};

      // 只查询未删除的角色
      conditions.delFlag = { $ne: '1' };

      if (keyword) {
        conditions.$or = [{ name: new RegExp(keyword as string, 'i') }, { label: new RegExp(keyword as string, 'i') }];
      }

      if (status !== undefined && status !== '') {
        conditions.status = status;
      }

      // 查询数据
      const [roles, total] = await Promise.all([RoleModel.find(conditions).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }), RoleModel.countDocuments(conditions)]);

      // 格式化响应数据
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

      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: formattedRoles,
          total,
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
   * 获取所有角色（用于下拉选择）
   */
  async getAllRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const roles = await RoleModel.find({
        delFlag: { $ne: '1' },
        status: '0',
      })
        .select('_id name label')
        .sort({ createdAt: 1 });

      const formattedRoles = roles.map((role) => ({
        id: role._id.toString(),
        name: role.name,
        label: role.label,
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
   * 获取角色详情
   */
  async getRoleDetail(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      res.json({
        code: 200,
        msg: 'success',
        data: {
          id: role._id.toString(),
          name: role.name,
          label: role.label,
          dataScope: role.dataScope,
          status: role.status,
          remark: role.remark || '',
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
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
      const { name, label, dataScope = '5', status = '0', remark = '' } = req.body;

      // 检查角色名称是否已存在
      const existingRole = await RoleModel.findOne({ name, delFlag: { $ne: '1' } });
      if (existingRole) {
        return res.status(400).json({ code: 400, msg: '角色名称已存在' });
      }

      const role = await RoleModel.create({
        name,
        label,
        dataScope,
        status,
        remark,
        delFlag: '0',
      });

      res.status(201).json({
        code: 201,
        msg: '创建成功',
        data: {
          id: role._id.toString(),
          name: role.name,
          label: role.label,
        },
      });
    } catch (error) {
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
      const { label, dataScope, status, remark } = req.body;

      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 更新字段
      if (label !== undefined) role.label = label;
      if (dataScope !== undefined) role.dataScope = dataScope;
      if (status !== undefined) role.status = status;
      if (remark !== undefined) role.remark = remark;

      await role.save();

      res.json({
        code: 200,
        msg: '更新成功',
        data: {
          id: role._id.toString(),
          name: role.name,
          label: role.label,
        },
      });
    } catch (error) {
      console.error('更新角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 删除角色（软删除）
   */
  async deleteRole(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      const role = await RoleModel.findById(id);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 保护admin角色
      if (role.name === 'admin') {
        return res.status(400).json({ code: 400, msg: '不能删除超级管理员角色' });
      }

      // 软删除
      role.delFlag = '1';
      await role.save();

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
   * 获取角色菜单权限
   */
  async getRoleMenus(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;

      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 获取角色关联的菜单ID
      const roleMenus = await UserRoleModel.find({ roleId }).select('menuId');
      const menuIds = roleMenus.map((rm: any) => rm.menuId);

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
   * 分配角色菜单权限
   */
  async assignRoleMenus(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;
      const { menuIds } = req.body;

      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 删除旧的关联
      await UserRoleModel.deleteMany({ roleId });

      // 创建新的关联
      if (menuIds && menuIds.length > 0) {
        const roleMenuDocs = menuIds.map((menuId: any) => ({
          roleId,
          menuId,
          userId: req.user?.userId || 'system',
        }));
        await UserRoleModel.insertMany(roleMenuDocs);
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
}

export const newRoleController = new NewRoleController();
