// src/middlewares/permission.ts
import { UserRoleService } from '@/services/userRole.service.ts';

const userRoleService = new UserRoleService();

/**
 * 检查用户是否有指定权限
 * @param permission 权限标识
 */
export const checkPermission = (permission: string) => {
  return async (req: ExpressRequest, res: ExpressResponse, next: Function) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      // 检查用户是否是超级管理员（拥有admin角色）
      const userRoles = await userRoleService.getUserRoles(userId);
      const isSuperAdmin = userRoles.some(role => role.name === 'admin');
      
      // 如果是超级管理员，跳过权限检查
      if (isSuperAdmin) {
        return next();
      }

      // 检查用户是否有该权限
      const hasPerm = await userRoleService.hasPermission(userId, permission);
      if (!hasPerm) {
        return res.status(403).json({ code: 403, msg: '没有操作权限' });
      }

      next();
    } catch (error) {
      console.error('权限检查失败:', error);
      res.status(500).json({ code: 500, msg: '权限检查失败' });
    }
  };
};

/**
 * 数据权限检查中间件
 * 根据用户的数据权限范围过滤查询条件
 */
export const checkDataScope = (options: { deptAlias?: string; userAlias?: string } = {}) => {
  return async (req: ExpressRequest, res: ExpressResponse, next: Function) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      // 获取用户的数据权限
      const { deptIds, dataScope } = await userRoleService.getUserDataScope(userId);

      // 将数据权限信息挂载到请求对象上
      (req as any).dataScope = {
        deptIds,
        dataScope,
        deptAlias: options.deptAlias || 'deptId',
        userAlias: options.userAlias || 'userId',
      };

      next();
    } catch (error) {
      console.error('数据权限检查失败:', error);
      res.status(500).json({ code: 500, msg: '数据权限检查失败' });
    }
  };
};

/**
 * 角色权限检查中间件
 * 检查用户是否拥有指定角色
 */
export const checkRole = (roleNames: string | string[]) => {
  return async (req: ExpressRequest, res: ExpressResponse, next: Function) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
      }

      // 如果是超级管理员，跳过角色检查
      if (req.user?.isSuperAdmin) {
        return next();
      }

      const requiredRoles = Array.isArray(roleNames) ? roleNames : [roleNames];

      // 获取用户的角色
      const userRoles = await userRoleService.getUserRoles(userId);
      const userRoleNames = userRoles.map((role) => (role as any).name);

      // 检查用户是否拥有任一所需角色
      const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));
      if (!hasRole) {
        return res.status(403).json({ code: 403, msg: '没有操作权限' });
      }

      next();
    } catch (error) {
      console.error('角色检查失败:', error);
      res.status(500).json({ code: 500, msg: '角色检查失败' });
    }
  };
};

/**
 * 获取用户权限信息中间件
 * 将用户权限信息挂载到请求对象上
 */
export const userPermissions = async (req: ExpressRequest, res: ExpressResponse, next: Function) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return next();
    }

    // 获取用户菜单权限
    const menus = await userRoleService.getUserMenus(userId);

    // 获取用户权限标识
    const permissions = await userRoleService.getUserPermissions(userId);

    // 获取用户数据权限
    const dataScope = await userRoleService.getUserDataScope(userId);

    // 将权限信息挂载到请求对象上
    req.userPermissions = {
      menus,
      permissions,
      dataScope,
    };

    next();
  } catch (error) {
    console.error('获取用户权限失败:', error);
    next();
  }
};
