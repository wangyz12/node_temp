import { Types } from 'mongoose';

import { DeptModel } from '@/models/system/dept/dept';
import { UserModel } from '@/models/system/users/users';
import { createAppError } from '@/utils/errorHandler.ts';

export class DeptService {
  /**
   * 获取部门树形结构（带数据权限过滤）
   */
  async getDeptTree(query: any, dataScope?: any) {
    const { status, keyword } = query;

    // 构建查询条件
    const conditions: any = { delFlag: '0' };

    if (status !== undefined && status !== '') {
      conditions.status = status;
    }

    if (keyword) {
      conditions.name = new RegExp(keyword as string, 'i');
    }

    // 应用数据权限过滤
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      // 部门树查询需要特殊处理部门ID过滤
      if (dataScope.filter.deptId) {
        if (dataScope.filter.deptId.$in && Array.isArray(dataScope.filter.deptId.$in)) {
          // 用户只能访问特定部门列表，需要构建完整的部门树但只显示有权限的部门
          conditions._id = { $in: dataScope.filter.deptId.$in };
        } else if (dataScope.filter.deptId) {
          // 用户只能访问单个部门
          conditions._id = dataScope.filter.deptId;
        }
      }
    } else if (dataScope?.deptIds?.length > 0) {
      // 用户只能访问特定部门列表
      conditions._id = { $in: dataScope.deptIds.map((id: any) => new Types.ObjectId(id)) };
    }

    // 获取所有符合条件的部门
    const allDepts = await DeptModel.find(conditions).sort({ orderNum: 1 });

    // 构建部门树
    const buildDeptTree = (parentId: string | null = null): any[] => {
      const filtered = allDepts.filter((dept) => {
        if (parentId === null) return !dept.parentId;
        return dept.parentId?.toString() === parentId;
      });

      return filtered.map((dept: any) => {
        const children = buildDeptTree(dept._id.toString());
        return {
          id: dept._id.toString(),
          name: dept.name,
          code: dept.code,
          parentId: dept.parentId?.toString() || null,
          ancestors: dept.ancestors || '',
          orderNum: dept.orderNum,
          leader: dept.leader,
          phone: dept.phone,
          email: dept.email,
          status: dept.status,
          remark: dept.remark || '',
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt,
          children: children.length > 0 ? children : undefined,
        };
      });
    };

    return buildDeptTree();
  }

  /**
   * 获取部门详情（带数据权限验证）
   */
  async getDeptDetail(id: string, dataScope?: any) {
    // 构建查询条件
    const conditions: any = { _id: id, delFlag: '0' };

    // 应用数据权限过滤
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      // 部门详情通常不需要部门ID过滤，但可以添加其他权限控制
      // 例如：检查用户是否有权限访问该部门
      if (dataScope.filter.deptId) {
        // 如果用户只能访问特定部门，检查请求的部门是否在权限范围内
        const deptIds = Array.isArray(dataScope.filter.deptId.$in) ? dataScope.filter.deptId.$in.map((id: any) => id.toString()) : [dataScope.filter.deptId.toString()];

        if (!deptIds.includes(id)) {
          throw createAppError('没有访问该部门的权限', { statusCode: 403 });
        }
      }
    } else if (dataScope?.deptIds?.length > 0) {
      // 检查请求的部门ID是否在用户权限范围内
      if (!dataScope.deptIds.includes(id)) {
        throw createAppError('没有访问该部门的权限', { statusCode: 403 });
      }
    }

    const dept: any = await DeptModel.findOne(conditions);
    if (!dept) {
      throw createAppError('部门不存在或没有访问权限', { statusCode: 404 });
    }

    return {
      id: dept._id.toString(),
      name: dept.name,
      parentId: dept.parentId?.toString() || null,
      ancestors: dept.ancestors || '',
      orderNum: dept.orderNum,
      status: dept.status,
      remark: dept.remark || '',
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    };
  }

  /**
   * 创建部门
   */
  async createDept(data: any) {
    const { name, parentId = null, orderNum = 0, status = '0', remark = '' }: any = data;

    // 检查部门名称是否已存在
    const existingDept = await DeptModel.findOne({ name, delFlag: '0' });
    if (existingDept) {
      throw createAppError('部门名称已存在', { statusCode: 409 });
    }

    // 计算祖先路径
    let ancestors = '';
    if (parentId) {
      const parentDept = await DeptModel.findOne({ _id: parentId, delFlag: '0' });
      if (!parentDept) {
        throw createAppError('父部门不存在', { statusCode: 404 });
      }
      ancestors = parentDept.ancestors ? `${parentDept.ancestors},${parentId}` : parentId;
    }

    // 创建部门
    const dept: any = await DeptModel.create({
      name,
      parentId: parentId ? new Types.ObjectId(parentId) : null,
      ancestors,
      orderNum,
      status,
      remark,
      delFlag: '0',
    } as any);

    return {
      id: dept._id.toString(),
      name: dept.name,
      parentId: dept.parentId?.toString() || null,
      ancestors: dept.ancestors || '',
      orderNum: dept.orderNum,
      status: dept.status,
      remark: dept.remark,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
    };
  }

  /**
   * 更新部门
   */
  async updateDept(id: string, data: any) {
    const { name, parentId, orderNum, status, remark } = data;

    // 检查部门是否存在
    const dept = await DeptModel.findOne({ _id: id, delFlag: '0' });
    if (!dept) {
      throw createAppError('部门不存在', { statusCode: 404 });
    }

    // 如果修改了名称，检查是否与其他部门冲突
    if (name && name !== dept.name) {
      const existingDept = await DeptModel.findOne({
        name,
        _id: { $ne: id },
        delFlag: '0',
      });
      if (existingDept) {
        throw createAppError('部门名称已存在', { statusCode: 409 });
      }
    }

    // 检查循环引用（如果修改了父部门）
    if (parentId && parentId !== dept.parentId?.toString()) {
      // 不能将部门设置为自己的子部门
      if (parentId === id) {
        throw createAppError('不能将部门设置为自己的父部门', { statusCode: 400 });
      }

      // 检查是否形成循环引用
      const checkCircular = async (currentDeptId: string, targetId: string): Promise<boolean> => {
        if (currentDeptId === targetId) return true;

        const currentDept = await DeptModel.findOne({ _id: currentDeptId, delFlag: '0' });
        if (!currentDept?.parentId) return false;

        return await checkCircular(currentDept.parentId.toString(), targetId);
      };

      const hasCircular = await checkCircular(parentId, id);
      if (hasCircular) {
        throw createAppError('不能形成循环引用', { statusCode: 400 });
      }
    }

    // 计算新的祖先路径
    let ancestors = dept.ancestors;
    if (parentId && parentId !== dept.parentId?.toString()) {
      const parentDept = await DeptModel.findOne({ _id: parentId, delFlag: '0' });
      if (!parentDept) {
        throw createAppError('父部门不存在', { statusCode: 404 });
      }
      ancestors = parentDept.ancestors ? `${parentDept.ancestors},${parentId}` : parentId;
    }

    // 更新部门
    const updatedDept: any = await DeptModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name && { name }),
          ...(parentId !== undefined && { parentId: parentId ? new Types.ObjectId(parentId) : null }),
          ...(ancestors !== undefined && { ancestors }),
          ...(orderNum !== undefined && { orderNum }),
          ...(status !== undefined && { status }),
          ...(remark !== undefined && { remark }),
        },
      },
      { returnDocument: 'after', runValidators: true }
    );

    // 如果修改了父部门或祖先路径，更新所有子部门的祖先路径
    if (parentId && parentId !== dept.parentId?.toString()) {
      await this.updateChildrenAncestors(id, ancestors);
    }

    return {
      id: updatedDept!._id.toString(),
      name: updatedDept!.name,
      parentId: updatedDept!.parentId?.toString() || null,
      ancestors: updatedDept!.ancestors || '',
      orderNum: updatedDept!.orderNum,
      status: updatedDept!.status,
      remark: updatedDept!.remark || '',
      createdAt: updatedDept!.createdAt,
      updatedAt: updatedDept!.updatedAt,
    };
  }

  /**
   * 删除部门
   */
  async deleteDept(id: string) {
    // 检查部门是否存在
    const dept = await DeptModel.findOne({ _id: id, delFlag: '0' });
    if (!dept) {
      throw createAppError('部门不存在', { statusCode: 404 });
    }

    // 检查是否有子部门
    const childCount = await DeptModel.countDocuments({ parentId: id, delFlag: '0' });
    if (childCount > 0) {
      throw createAppError('该部门下有子部门，无法删除', { statusCode: 400 });
    }

    // 检查部门下是否有用户
    const userCount = await UserModel.countDocuments({ deptId: id, delFlag: '0' });
    if (userCount > 0) {
      throw createAppError('该部门下有用户，无法删除', { statusCode: 400 });
    }

    // 软删除部门
    await DeptModel.findByIdAndUpdate(id, { $set: { delFlag: '1' } });

    return { success: true };
  }

  /**
   * 获取所有部门（扁平列表，带数据权限过滤）
   */
  async getAllDepts(dataScope?: any) {
    // 构建查询条件
    const conditions: any = { delFlag: '0', status: '0' };

    // 应用数据权限过滤
    if (dataScope?.filter && Object.keys(dataScope.filter).length > 0) {
      if (dataScope.filter.deptId) {
        if (dataScope.filter.deptId.$in && Array.isArray(dataScope.filter.deptId.$in)) {
          conditions._id = { $in: dataScope.filter.deptId.$in };
        } else if (dataScope.filter.deptId) {
          conditions._id = dataScope.filter.deptId;
        }
      }
    } else if (dataScope?.deptIds?.length > 0) {
      conditions._id = { $in: dataScope.deptIds.map((id: any) => new Types.ObjectId(id)) };
    }

    const depts = await DeptModel.find(conditions).sort({ orderNum: 1 }).select('name parentId');

    return depts.map((dept) => ({
      id: dept._id.toString(),
      name: dept.name,
      parentId: dept.parentId?.toString() || null,
    }));
  }

  /**
   * 获取部门用户统计
   */
  async getDeptUserStats() {
    const depts = await DeptModel.find({ delFlag: '0', status: '0' }).sort({ orderNum: 1 }).select('name');

    // 并行查询每个部门的用户数量
    const stats = await Promise.all(
      depts.map(async (dept) => {
        const userCount = await UserModel.countDocuments({
          deptId: dept._id,
          delFlag: '0',
        });
        return {
          id: dept._id.toString(),
          name: dept.name,
          userCount,
        };
      })
    );

    return stats;
  }

  /**
   * 更新子部门的祖先路径
   */
  private async updateChildrenAncestors(parentId: string, parentAncestors: string) {
    const children = await DeptModel.find({ parentId, delFlag: '0' });

    for (const child of children) {
      const childAncestors = parentAncestors ? `${parentAncestors},${parentId}` : parentId;
      await DeptModel.findByIdAndUpdate(child._id, {
        $set: { ancestors: childAncestors },
      });

      // 递归更新孙子部门
      await this.updateChildrenAncestors(child._id.toString(), childAncestors);
    }
  }

  // ==================== 数据权限工具方法 ====================

  /**
   * 获取部门及其所有子部门的ID数组
   * @param deptId 部门ID
   * @returns 部门ID数组（包含传入的部门ID及其所有子部门ID）
   */
  async getChildrenDepts(deptId: string): Promise<string[]> {
    try {
      if (!deptId || !Types.ObjectId.isValid(deptId)) {
        return [];
      }

      // 1. 首先获取目标部门
      const targetDept = await DeptModel.findById(deptId).select('_id ancestors').lean();

      if (!targetDept) {
        return [];
      }

      // 2. 使用 ancestors 字段进行正则匹配查询所有子部门
      // 构建正则表达式：查找 ancestors 中包含目标部门ID的部门
      const regexPattern = new RegExp(`,${deptId}(,|$)`);

      const childDepts = await DeptModel.find({
        ancestors: { $regex: regexPattern },
        delFlag: '0',
        status: '0',
      })
        .select('_id')
        .lean();

      // 3. 提取所有部门ID（包括目标部门本身）
      const deptIds = [deptId, ...childDepts.map((dept) => dept._id.toString())];

      return [...new Set(deptIds)]; // 去重
    } catch (error) {
      console.error('获取子部门失败:', error);
      return [];
    }
  }

  /**
   * 检查部门是否是指定部门的子部门
   * @param parentDeptId 父部门ID
   * @param childDeptId 子部门ID
   * @returns 如果是子部门返回true，否则返回false
   */
  async isChildDept(parentDeptId: string, childDeptId: string): Promise<boolean> {
    try {
      if (!parentDeptId || !childDeptId || !Types.ObjectId.isValid(parentDeptId) || !Types.ObjectId.isValid(childDeptId)) {
        return false;
      }

      if (parentDeptId === childDeptId) {
        return true; // 部门自身也算作子部门
      }

      const childDept = await DeptModel.findById(childDeptId).select('ancestors').lean();

      if (!childDept || !childDept.ancestors) {
        return false;
      }

      // 检查父部门ID是否在子部门的 ancestors 中
      return childDept.ancestors.includes(`,${parentDeptId},`) || childDept.ancestors.endsWith(`,${parentDeptId}`);
    } catch (error) {
      console.error('检查部门关系失败:', error);
      return false;
    }
  }

  /**
   * 批量获取多个部门的子部门
   * @param deptIds 部门ID数组
   * @returns 所有部门的子部门ID数组（去重）
   */
  async getMultipleChildrenDepts(deptIds: string[]): Promise<string[]> {
    try {
      if (!deptIds || deptIds.length === 0) {
        return [];
      }

      // 过滤无效的部门ID
      const validDeptIds = deptIds.filter((id) => id && Types.ObjectId.isValid(id));

      if (validDeptIds.length === 0) {
        return [];
      }

      // 构建正则表达式：查找 ancestors 中包含任意一个目标部门ID的部门
      const regexPatterns = validDeptIds.map((id) => new RegExp(`,${id}(,|$)`));

      const childDepts = await DeptModel.find({
        $or: regexPatterns.map((pattern) => ({ ancestors: { $regex: pattern } })),
        delFlag: '0',
        status: '0',
      })
        .select('_id')
        .lean();

      // 提取所有部门ID（包括原始部门ID）
      const allDeptIds = [...validDeptIds, ...childDepts.map((dept) => dept._id.toString())];

      return [...new Set(allDeptIds)]; // 去重
    } catch (error) {
      console.error('批量获取子部门失败:', error);
      return [];
    }
  }

  /**
   * 根据部门ID获取部门路径（从根部门到当前部门的路径）
   * @param deptId 部门ID
   * @returns 部门路径数组
   */
  async getDeptPath(deptId: string): Promise<any[]> {
    try {
      if (!deptId || !Types.ObjectId.isValid(deptId)) {
        return [];
      }

      const dept = await DeptModel.findById(deptId).select('ancestors').lean();

      if (!dept || !dept.ancestors) {
        return [];
      }

      // 解析 ancestors 字段，获取所有祖先部门ID
      const ancestorIds = dept.ancestors.split(',').filter((id) => id && Types.ObjectId.isValid(id));

      // 查询所有祖先部门
      const ancestors = await DeptModel.find({
        _id: { $in: ancestorIds.map((id) => new Types.ObjectId(id)) },
        delFlag: '0',
        status: '0',
      })
        .select('_id name code level')
        .sort({ level: 1 })
        .lean();

      // 添加当前部门
      const currentDept = await DeptModel.findById(deptId).select('_id name code level').lean();

      if (currentDept) {
        ancestors.push(currentDept);
      }

      return ancestors.map((dept) => ({
        id: dept._id.toString(),
        name: dept.name,
        code: dept.code,
        level: dept.level,
      }));
    } catch (error) {
      console.error('获取部门路径失败:', error);
      return [];
    }
  }
}

// 创建单例实例
const deptServiceInstance = new DeptService();

// 导出单例实例（推荐使用）
export default deptServiceInstance;
