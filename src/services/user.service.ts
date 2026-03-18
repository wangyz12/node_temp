// src/services/user.service.ts
import { Types } from 'mongoose';

import { DeptModel } from '@/models/dept/dept.ts';
import { UserModel } from '@/models/users/users.ts';
import { UserRoleModel } from '@/models/userRole/userRole.ts';
import { RoleModel } from '@/models/role/role.ts';

export class UserService {
  /**
   * 获取用户列表（带数据权限过滤）
   */
  async getUserList(query: any, dataScope?: any) {
    const { page = 1, limit = 10, keyword, deptId } = query;
    const skip = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: any = {};

    // 1. 关键词搜索
    if (keyword) {
      conditions.$or = [{ account: new RegExp(keyword, 'i') }, { username: new RegExp(keyword, 'i') }, { phone: new RegExp(keyword, 'i') }];
    }

    // 2. 指定部门查询
    if (deptId) {
      conditions.deptId = new Types.ObjectId(deptId);
    }

    // 3. 数据权限过滤
    if (dataScope?.deptIds?.length > 0) {
      conditions.deptId = { $in: dataScope.deptIds.map((id: any) => new Types.ObjectId(id)) };
    }

    // 查询总数
    const total = await UserModel.countDocuments(conditions);

    // 查询用户列表（关联部门信息）
    const users = await UserModel.find(conditions)
      .populate('deptId', 'name code') // 只返回部门的 name 和 code
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return {
      list: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * 获取用户详情
   */
  async getUserById(id: string) {
    const user = await UserModel.findById(id).populate('deptId', 'name code').select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    // 获取用户角色信息
    const userRoles = await UserRoleModel.find({ userId: id }).populate<{ roleId: any }>('roleId');
    const roles = userRoles.map(ur => {
      const role = ur.roleId as any;
      return {
        id: role._id ? role._id.toString() : role.id,
        name: role.name,
        label: role.label,
        dataScope: role.dataScope
      };
    });
    
    // 转换为普通对象并添加角色信息
    const userObj = user.toObject() as any;
    userObj.roles = roles;
    
    return userObj;
  }

  /**
   * 创建用户
   */
  async createUser(data: any) {
    const user = await UserModel.create(data);
    return user;
  }

  /**
   * 更新用户
   */
  async updateUser(id: string, data: any) {
    const user = await UserModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).select('-password');

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string) {
    const user = await UserModel.findByIdAndDelete(id);
    if (!user) {
      throw new Error('用户不存在');
    }
    return user;
  }
}
