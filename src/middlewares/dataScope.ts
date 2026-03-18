// src/middlewares/dataScope.middleware.ts
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { RoleModel } from '@/models/role/role.ts';
import { RoleDeptModel } from '@/models/roleDept/roleDept.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';

/**
 * 数据权限过滤
 * 自动拼接部门查询条件
 */
export const dataScope = (options: {
  deptAlias?: string; // 部门表别名
  userAlias?: string; // 用户表别名
}) => {
  return async (req: ExpressRequest | any, res: ExpressResponse | any, next: ExpressNext) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next();
      }

      // 获取用户的所有角色
      const userRoles = await UserRoleModel.find({ userId }).populate('roleId');

      // 检查是否有全部数据权限的角色
      const hasAllDataScope = userRoles.some((ur: any) => ur.roleId?.dataScope === '1');

      if (hasAllDataScope) {
        // 总公司管理员，不加任何限制
        return next();
      }

      // 收集需要的数据权限部门ID
      let deptIds: string[] = [];

      for (const ur of userRoles) {
        const role = ur.roleId as any;

        switch (role?.dataScope) {
          case '2': // 自定义数据权限
            const roleDepts = await RoleDeptModel.find({ roleId: role._id });
            deptIds.push(...roleDepts.map((rd) => rd.deptId.toString()));
            break;

          case '3': // 本部门数据权限
            deptIds.push(req.user?.deptId);
            break;

          case '4': // 本部门及以下
            // 需要递归查询子部门
            const childDepts = await getChildDepts(req.user?.deptId);
            deptIds.push(req.user?.deptId, ...childDepts);
            break;

          case '5': // 仅本人数据权限
            // 这里会在具体service中处理
            break;
        }
      }

      // 去重
      deptIds = [...new Set(deptIds.filter(Boolean))];

      // 将数据权限条件挂载到请求对象
      req.dataScope = {
        deptIds,
        deptAlias: options.deptAlias || 'd',
        userAlias: options.userAlias || 'u',
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 递归查询子部门
async function getChildDepts(deptId: string): Promise<string[]> {
  const DeptModel = mongoose.model('Dept');
  const children = await DeptModel.find({ parentId: deptId });
  let ids: string[] = [];

  for (const child of children) {
    ids.push(child._id.toString());
    const grandChildren = await getChildDepts(child._id.toString());
    ids = [...ids, ...grandChildren];
  }

  return ids;
}

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      dataScope?: {
        deptIds: string[];
        deptAlias: string;
        userAlias: string;
      };
    }
  }
}
