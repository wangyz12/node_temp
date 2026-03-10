// src/validation/menuViedation.ts
import { body, param } from 'express-validator';
import util from '@/utils/utils.js';

export const addMenu = [
  body('name')
    .notEmpty()
    .withMessage('菜单名称不能为空')
    .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .withMessage('菜单名称必须以字母开头，只能包含字母、数字、下划线'),
  body('path')
    .notEmpty()
    .withMessage('路径不能为空')
    .matches(/^\/[a-zA-Z0-9_\-/]*$/)
    .withMessage('路径格式不正确'),
  body('component').notEmpty().withMessage('组件路径不能为空'),
  body('title').notEmpty().withMessage('标题不能为空'),
  util.handleValidationErrors,
];

export const updateMenu = [
  param('id').isMongoId().withMessage('无效的菜单ID'),
  ...addMenu, // 复用添加的验证规则
];

export const deleteMenu = [param('id').isMongoId().withMessage('无效的菜单ID'), util.handleValidationErrors];
