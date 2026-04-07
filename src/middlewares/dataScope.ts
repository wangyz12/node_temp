// src/middlewares/dataScope.middleware.ts
import { UserRoleService } from '@/services/system/userRole.service.ts';

/**
 * 数据权限过滤中间件（强化版）
 * 自动构建数据权限查询条件
 */
export const dataScope = (options: {
  deptAlias?: string; // 部门表别名（保持兼容）
  userAlias?: string; // 用户表别名（保持兼容）
  createdByField?: string; // 创建人字段名，默认为 'createdBy'
  deptIdField?: string; // 部门ID字段名，默认为 'deptId'
}) => {
  return async (req: ExpressRequest | any, _res: ExpressResponse | any, next: ExpressNext) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        // 未登录用户，设置空数据权限
        req.dataScope = {
          deptIds: [],
          dataScope: '5',
          filter: {},
          deptAlias: options.deptAlias || 'd',
          userAlias: options.userAlias || 'u',
        };
        return next();
      }

      // 创建用户角色服务实例
      const userRoleService = new UserRoleService();

      // 获取用户的数据权限范围（包含自动构建的过滤器）
      const dataScopeInfo = await userRoleService.getUserDataScope(userId);

      // 构建最终的数据权限对象
      req.dataScope = {
        // 保持原有字段（兼容现有代码）
        deptIds: dataScopeInfo.deptIds || [],
        dataScope: dataScopeInfo.dataScope || '5',
        deptAlias: options.deptAlias || 'd',
        userAlias: options.userAlias || 'u',

        // 新增字段
        filter: dataScopeInfo.filter || {},
        createdByField: options.createdByField || 'createdBy',
        deptIdField: options.deptIdField || 'deptId',

        // 用户信息
        userId: userId,
        userDeptId: req.user?.deptId,

        // 工具方法：获取适用于当前模型的查询条件
        getQueryCondition: function (modelName?: string) {
          // 如果没有过滤器，返回空对象
          if (!this.filter || Object.keys(this.filter).length === 0) {
            return {};
          }

          // 根据模型名称调整字段名
          let condition = { ...this.filter };

          // 如果是部门ID条件，可能需要调整字段名
          if (condition.deptId && this.deptIdField !== 'deptId') {
            condition[this.deptIdField] = condition.deptId;
            delete condition.deptId;
          }

          // 如果是创建人条件，可能需要调整字段名
          if (condition.createdBy && this.createdByField !== 'createdBy') {
            condition[this.createdByField] = condition.createdBy;
            delete condition.createdBy;
          }

          return condition;
        },

        // 工具方法：检查是否有权限访问指定部门
        hasDeptAccess: function (deptId: string): boolean {
          if (!deptId) return false;

          // 全部数据权限
          if (this.dataScope === '1') return true;

          // 仅本人权限，不能直接访问部门
          if (this.dataScope === '5') return false;

          // 检查部门ID是否在权限范围内
          return this.deptIds.includes(deptId);
        },

        // 工具方法：检查是否有权限访问指定用户创建的数据
        hasUserAccess: function (createdByUserId: string): boolean {
          if (!createdByUserId) return false;

          // 全部数据权限
          if (this.dataScope === '1') return true;

          // 仅本人权限：只能访问自己创建的数据
          if (this.dataScope === '5') {
            return createdByUserId === this.userId;
          }

          // 其他权限等级：可以访问（部门权限已通过deptId过滤）
          return true;
        },
      };

      next();
    } catch (error: any) {
      console.error('数据权限中间件错误:', error);

      // 出错时设置最严格的数据权限
      req.dataScope = {
        deptIds: [],
        dataScope: '5',
        filter: { createdBy: req.user?.userId },
        deptAlias: options.deptAlias || 'd',
        userAlias: options.userAlias || 'u',
        createdByField: options.createdByField || 'createdBy',
        deptIdField: options.deptIdField || 'deptId',
        userId: req.user?.userId,
        userDeptId: req.user?.deptId,
        getQueryCondition: function () {
          return this.userId ? { [this.createdByField]: this.userId } : {};
        },
        hasDeptAccess: function () {
          return false;
        },
        hasUserAccess: function (createdByUserId: string) {
          return createdByUserId === this.userId;
        },
      };

      next();
    }
  };
};

/**
 * 简易数据权限中间件（兼容旧版本）
 * 仅设置基本的deptIds和dataScope字段
 */
export const simpleDataScope = dataScope;
