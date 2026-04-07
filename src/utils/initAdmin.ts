// src/utils/initAdmin.ts
import { DeptModel } from '../models/system/dept/dept.js';
import { RoleModel } from '../models/system/role/role.js';
import { UserRoleModel } from '../models/system/userRole/userRole.js';
import { UserModel } from '../models/system/users/users.js';

import { logger } from './logger.js';

/**
 * 初始化管理员账号
 * 如果管理员账号不存在，则自动创建
 */
export async function initAdminAccount() {
  try {
    logger.info('🔍 检查管理员账号...');

    // 1. 检查管理员账号是否已存在
    const existingAdmin = await UserModel.findOne({ account: 'admin' });
    if (existingAdmin) {
      logger.info('✅ 管理员账号已存在');
      return;
    }

    logger.info('🔄 管理员账号不存在，开始初始化...');

    // 2. 创建或获取总公司部门
    let hqDept = await DeptModel.findOne({ code: 'HQ' });
    if (!hqDept) {
      hqDept = await DeptModel.create({
        name: '总公司',
        code: 'HQ',
        parentId: null,
        ancestors: ',',
        orderNum: 1,
        status: '0',
      });
      logger.success('总公司部门创建成功');
    }

    // 3. 创建或获取管理员角色
    let adminRole = await RoleModel.findOne({ name: 'admin' });
    if (!adminRole) {
      adminRole = await RoleModel.create({
        name: 'admin',
        label: '管理员',
        dataScope: '1',
        status: '0',
        remark: '系统管理员',
      });
      logger.success('管理员角色创建成功');
    }

    // 4. 创建管理员用户
    const adminUser = await UserModel.create({
      account: 'admin',
      password: 'admin123', // 密码会自动加密
      username: '系统管理员',
      deptId: hqDept._id,
    });

    // 5. 分配角色
    await UserRoleModel.create({
      userId: adminUser._id,
      roleId: adminRole._id,
    });

    logger.success('✅ 管理员账号初始化成功！');
    logger.info('📝 账号: admin / admin123');
  } catch (error) {
    logger.error('初始化管理员账号失败:', error);
  }
}
