// src/controller/modules/dept/deptController.ts
import { Types } from 'mongoose';

import { DeptModel } from '@/models/dept/dept.ts';

export class DeptController {
  /**
   * 获取部门列表（树形结构）
   */
  async getDeptTree(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { status, keyword } = req.query;

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
      console.log('部门树查询条件:', conditions);
      console.log('查询到的部门数量:', allDepts.length);
      allDepts.forEach(dept => {
        console.log(`- ${dept.name}: id=${dept._id}, parentId=${dept.parentId}, status=${dept.status}, delFlag=${dept.delFlag}`);
      });

      // 构建部门树
      const buildDeptTree = (parentId: string | null = null): any[] => {
        const filtered = allDepts.filter((dept) => {
          if (parentId === null) return !dept.parentId;
          return dept.parentId?.toString() === parentId;
        });
        
        console.log(`构建部门树: parentId=${parentId}, 找到 ${filtered.length} 个部门`);
        
        return filtered.map((dept) => {
          const children: any[] = buildDeptTree(dept._id.toString());
          return {
            ...dept.toObject(),
            children: children.length > 0 ? children : undefined,
          };
        });
      };

      const deptTree = buildDeptTree();
      console.log('构建的部门树:', JSON.stringify(deptTree, null, 2));

      res.json({
        code: 200,
        msg: 'success',
        data: deptTree,
      });
    } catch (error) {
      console.error('获取部门树失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取部门详情
   */
  async getDeptDetail(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      const dept = await DeptModel.findById(id);
      if (!dept || dept.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '部门不存在' });
      }

      res.json({
        code: 200,
        msg: 'success',
        data: dept,
      });
    } catch (error) {
      console.error('获取部门详情失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 创建部门
   */
  async createDept(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { name, code, parentId, orderNum, leader, phone, email, status } = req.body;

      // 检查部门编码是否已存在
      const existingDept = await DeptModel.findOne({ code });
      if (existingDept) {
        return res.status(409).json({ code: 409, msg: '部门编码已存在' });
      }

      // 构建祖先路径
      let ancestors = '';
      if (parentId) {
        const parentDept = await DeptModel.findById(parentId);
        if (!parentDept) {
          return res.status(404).json({ code: 404, msg: '父级部门不存在' });
        }
        ancestors = parentDept.ancestors ? `${parentDept.ancestors}${parentId},` : `,${parentId},`;
      } else {
        ancestors = ',';
      }

      // 创建部门
      const dept = await DeptModel.create({
        name,
        code,
        parentId: parentId || null,
        ancestors,
        orderNum: orderNum || 0,
        leader,
        phone,
        email,
        status: status || '0',
      });

      res.status(201).json({
        code: 201,
        msg: '创建成功',
        data: dept,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ code: 409, msg: '部门编码已存在' });
      }
      console.error('创建部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 更新部门
   */
  async updateDept(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;
      const { name, code, parentId, orderNum, leader, phone, email, status } = req.body;
      
      // 类型断言，确保id和parentId是字符串
      const deptId = id as string;
      const parentIdStr = parentId as string;

      // 检查ID是否有效
      if (!deptId || deptId === 'undefined' || deptId === 'null') {
        return res.status(400).json({ code: 400, msg: '部门ID无效' });
      }

      // 检查部门是否存在
      const dept = await DeptModel.findById(deptId);
      if (!dept || dept.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '部门不存在' });
      }

      // 检查部门编码是否与其他部门冲突
      if (code && code !== dept.code) {
        const existingDept = await DeptModel.findOne({ code, _id: { $ne: new Types.ObjectId(deptId) } });
        if (existingDept) {
          return res.status(409).json({ code: 409, msg: '部门编码已存在' });
        }
      }

      // 检查父级部门是否合法（不能将自己或自己的子部门设为父级）
      if (parentIdStr && parentIdStr !== dept.parentId?.toString()) {
        // 不能将自己设为父级
        if (parentIdStr === deptId) {
          return res.status(400).json({ code: 400, msg: '不能将部门设为自己的父级' });
        }

        // 检查是否将父级设为自己的子部门
        const checkCircular = async (currentDeptId: string, targetId: string): Promise<boolean> => {
          const children = await DeptModel.find({ parentId: currentDeptId, delFlag: '0' });
          for (const child of children) {
            if (child._id.toString() === targetId) {
              return true;
            }
            if (await checkCircular(child._id.toString(), targetId)) {
              return true;
            }
          }
          return false;
        };

        if (await checkCircular(deptId, parentIdStr)) {
          return res.status(400).json({ code: 400, msg: '不能将父级部门设为自己的子部门' });
        }

        // 更新祖先路径
        const parentDept = await DeptModel.findById(parentIdStr);
        if (!parentDept) {
          return res.status(404).json({ code: 404, msg: '父级部门不存在' });
        }
        dept.ancestors = parentDept.ancestors ? `${parentDept.ancestors}${parentIdStr},` : `,${parentIdStr},`;
        dept.parentId = new Types.ObjectId(parentIdStr);
      }

      // 更新其他字段
      if (name) dept.name = name;
      if (code) dept.code = code;
      if (orderNum !== undefined) dept.orderNum = orderNum;
      if (leader !== undefined) dept.leader = leader;
      if (phone !== undefined) dept.phone = phone;
      if (email !== undefined) dept.email = email;
      if (status !== undefined) dept.status = status;

      await dept.save();

      // 更新所有子部门的祖先路径
      await this.updateChildrenAncestors(deptId, dept.ancestors);

      res.json({
        code: 200,
        msg: '更新成功',
        data: dept,
      });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(409).json({ code: 409, msg: '部门编码已存在' });
      }
      console.error('更新部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 递归更新子部门的祖先路径
   */
  private async updateChildrenAncestors(parentId: string, parentAncestors: string) {
    const children = await DeptModel.find({ parentId, delFlag: '0' });

    for (const child of children) {
      const newAncestors = `${parentAncestors}${parentId},`;
      child.ancestors = newAncestors;
      await child.save();

      // 递归更新孙子部门
      await this.updateChildrenAncestors(child._id.toString(), newAncestors);
    }
  }

  /**
   * 删除部门
   */
  async deleteDept(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { id } = req.params;

      // 检查部门是否存在
      const dept = await DeptModel.findById(id);
      if (!dept || dept.delFlag === '1') {
        return res.status(404).json({ code: 404, msg: '部门不存在' });
      }

      // 检查是否有子部门
      const childCount = await DeptModel.countDocuments({ parentId: id, delFlag: '0' });
      if (childCount > 0) {
        return res.status(400).json({ code: 400, msg: '该部门下存在子部门，无法删除' });
      }

      // 检查是否有用户关联该部门
      const { UserModel } = await import('@/models/users/users.ts');
      const userCount = await UserModel.countDocuments({ deptId: id });
      if (userCount > 0) {
        return res.status(400).json({ code: 400, msg: '该部门下存在用户，无法删除' });
      }

      // 软删除：标记为已删除
      dept.delFlag = '1';
      await dept.save();

      res.json({
        code: 200,
        msg: '删除成功',
      });
    } catch (error) {
      console.error('删除部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取所有部门（用于下拉选择）
   */
  async getAllDepts(req: ExpressRequest, res: ExpressResponse) {
    try {
      const depts = await DeptModel.find({ delFlag: '0', status: '0' }).select('id name code parentId').sort({ orderNum: 1 });

      // 构建简单的树形结构
      const buildSimpleTree = (parentId: string | null = null): any[] => {
        return depts
          .filter((dept) => {
            if (parentId === null) return !dept.parentId;
            return dept.parentId?.toString() === parentId;
          })
          .map((dept) => {
            const children: any[] = buildSimpleTree(dept._id.toString());
            return {
              id: dept._id.toString(),
              label: dept.name,
              children: children.length > 0 ? children : undefined,
            };
          });
      };

      const deptTree = buildSimpleTree();

      res.json({
        code: 200,
        msg: 'success',
        data: deptTree,
      });
    } catch (error) {
      console.error('获取所有部门失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }

  /**
   * 获取部门用户数统计
   */
  async getDeptUserStats(req: ExpressRequest, res: ExpressResponse) {
    try {
      const { UserModel } = await import('@/models/users/users.ts');

      // 获取所有部门
      const depts = await DeptModel.find({ delFlag: '0' }).select('id name');

      // 统计每个部门的用户数
      const stats = await Promise.all(
        depts.map(async (dept) => {
          const userCount = await UserModel.countDocuments({ deptId: dept._id });
          return {
            deptId: dept._id.toString(),
            deptName: dept.name,
            userCount,
          };
        })
      );

      res.json({
        code: 200,
        msg: 'success',
        data: stats,
      });
    } catch (error) {
      console.error('获取部门用户统计失败:', error);
      res.status(500).json({ code: 500, msg: '服务器错误' });
    }
  }
}

export default new DeptController();
