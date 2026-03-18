// src/routes/modules/dept/dept.ts
import express from 'express';

import controller from '@/controller/index.ts';
import { authenticate } from '@/middlewares/auth.ts';
import { checkPermission } from '@/middlewares/permission.ts';

const router = express.Router();

// 所有部门相关接口都需要认证
router.use(authenticate);

// 获取部门树
router.get('/tree', checkPermission('system:dept:list'), controller.deptController.getDeptTree);

// 获取所有部门（下拉选择）
router.get('/all', checkPermission('system:dept:list'), controller.deptController.getAllDepts);

// 获取部门详情
router.get('/detail/:id', checkPermission('system:dept:query'), controller.deptController.getDeptDetail);

// 创建部门
router.post('/create', checkPermission('system:dept:add'), controller.deptController.createDept);

// 更新部门
router.put('/update/:id', checkPermission('system:dept:edit'), controller.deptController.updateDept);

// 删除部门
router.delete('/delete/:id', checkPermission('system:dept:remove'), controller.deptController.deleteDept);

// 获取部门用户统计
router.get('/stats', checkPermission('system:dept:list'), controller.deptController.getDeptUserStats);

export default router;
