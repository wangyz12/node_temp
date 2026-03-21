// src/controller/modules/userRole/userRoleController.ts
import { RoleModel } from '@/models/role/role.ts';
import { UserModel } from '@/models/users/users.ts';
import { UserRoleService } from '@/services/userRole.service.ts';

const userRoleService = new UserRoleService();

export class UserRoleController {
  /**
   * 为用户分配角色
   */
  async assignUserRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { userId, roleIds } = req.body;

      console.log('📡 分配用户角色请求:', { userId, roleIds, body: req.body });

      if (!userId || !Array.isArray(roleIds)) {
        console.log('❌ 参数错误:', { userId, roleIds });
        return res.status(400).json({ code: 400, msg: '参数错误' });
      }

      // 检查用户是否存在
      const user = await UserModel.findById(userId);
      if (!user) {
        console.log('❌ 用户不存在:', userId);
        return res.status(404).json({ code: 404, msg: '用户不存在' });
      }

      console.log('✅ 找到用户:', user.account);

      // 分配角色
      await userRoleService.assignRolesToUser(userId, roleIds);

      console.log('✅ 角色分配成功');

      res.json({
        code: 200,
        msg: '角色分配成功',
      });
    } catch (error: any) {
      if (error.message === '用户不存在' || error.message === '部分角色不存在或已停用') {
        return res.status(400).json({ code: 400, msg: error.message });
      }
      console.error('分配用户角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取用户的角色列表
   */
  async getUserRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { userId } = req.params;
      
      // 类型断言
      const userIdStr = userId as string;

      const roles = await userRoleService.getUserRoles(userIdStr);

      res.json({
        code: 200,
        msg: 'success',
        data: roles,
      });
    } catch (error) {
      console.error('获取用户角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取用户的菜单权限
   */
  async getUserMenus(req: ExpressRequest, res: ExpressResponse) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      const menus = await userRoleService.getUserMenus(userId);

      res.json({
        code: 200,
        msg: 'success',
        data: menus,
      });
    } catch (error) {
      console.error('获取用户菜单失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取用户的权限标识列表
   */
  async getUserPermissions(req: ExpressRequest, res: ExpressResponse) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      const permissions = await userRoleService.getUserPermissions(userId);

      res.json({
        code: 200,
        msg: 'success',
        data: permissions,
      });
    } catch (error) {
      console.error('获取用户权限失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取用户的数据权限
   */
  async getUserDataScope(req: ExpressRequest, res: ExpressResponse) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      const dataScope = await userRoleService.getUserDataScope(userId);

      res.json({
        code: 200,
        msg: 'success',
        data: dataScope,
      });
    } catch (error) {
      console.error('获取用户数据权限失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 批量分配角色给用户
   */
  async batchAssignRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { userIds, roleIds } = req.body;

      if (!Array.isArray(userIds) || !Array.isArray(roleIds)) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
      }

      const results = await userRoleService.batchUpdateUserRoles(userIds, roleIds);

      res.json({
        code: 200,
        msg: '批量分配成功',
        data: results,
      });
    } catch (error: any) {
      if (error.message === '部分用户不存在' || error.message === '部分角色不存在或已停用') {
        return res.status(400).json({ code: 400, msg: error.message });
      }
      console.error('批量分配角色失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取用户详情（包含角色信息）
   */
  async getUserWithRoles(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { userId } = req.params;
      
      // 类型断言
      const userIdStr = userId as string;

      const userWithRoles = await userRoleService.getUserWithRoles(userIdStr);

      res.json({
        code: 200,
        msg: 'success',
        data: userWithRoles,
      });
    } catch (error: any) {
      if (error.message === '用户不存在') {
        return res.status(404).json({ code: 404, msg: error.message });
      }
      console.error('获取用户详情失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 检查用户是否有某个权限
   */
  async checkUserPermission(req: ExpressRequest, res: ExpressResponse) {
    try {
      const userId = req.user?.userId;
      const { permission } = req.body;

      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      if (!permission) {
        return res.status(400).json({ code: 400, msg: '权限标识不能为空' });
      }

      const hasPermission = await userRoleService.hasPermission(userId, permission);

      res.json({
        code: 200,
        msg: 'success',
        data: { hasPermission },
      });
    } catch (error) {
      console.error('检查用户权限失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取角色下的用户列表
   */
  async getRoleUsers(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { roleId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // 检查角色是否存在
      const role = await RoleModel.findById(roleId);
      if (!role || role.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '角色不存在' });
      }

      // 获取拥有该角色的用户ID
      const { UserRoleModel } = await import('@/models/userRole/userRole.ts');
      const userRoles = await UserRoleModel.find({ roleId }).skip(skip).limit(Number(limit));

      const userIds = userRoles.map((ur) => ur.userId);

      // 获取用户详情
      const users = await UserModel.find({ _id: { $in: userIds } })
        .populate('deptId', 'name code')
        .select('-password');

      // 获取总数
      const total = await UserRoleModel.countDocuments({ roleId });

      res.json({
        code: 200,
        msg: 'success',
        data: {
          list: users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取角色用户列表失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }
}

export default new UserRoleController();
