// src/services/dept.service.ts
import { Types } from 'mongoose';

import { DeptModel } from '@/models/system/dept/dept';
import { UserModel } from '@/models/system/users/users';
import { createAppError } from '@/utils/errorHandler.ts';

export class DeptService {
  /**
   * 获取部门树形结构
   */
  async getDeptTree(query: any) {
    const { status, keyword } = query;

    // 构建查询条件
    const conditions: any = { delFlag: '0' };

    if (status !== undefined && status !== '') {
      conditions.status = status;
    }

    if (keyword) {
      conditions.name = new RegExp(keyword as string, 'i');
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
          parentId: dept.parentId?.toString() || null,
          ancestors: dept.ancestors || '',
          orderNum: dept.orderNum,
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
   * 获取部门详情
   */
  async getDeptDetail(id: string) {
    const dept: any = await DeptModel.findOne({ _id: id, delFlag: '0' });
    if (!dept) {
      throw createAppError('部门不存在', { statusCode: 404 });
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
   * 获取所有部门（扁平列表）
   */
  async getAllDepts() {
    const depts = await DeptModel.find({ delFlag: '0', status: '0' }).sort({ orderNum: 1 }).select('name parentId');

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
}
