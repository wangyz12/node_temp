// src/validators/menu.validator.ts
import { body } from 'express-validator';
import utils from '@/utils/utils.js';

// 添加菜单验证
export const addMenu = [
  body('name')
    .notEmpty()
    .withMessage('路由名称不能为空')
    .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .withMessage('路由名称必须以字母开头，只能包含字母、数字、下划线')
    .trim(),

  body('path')
    .notEmpty()
    .withMessage('路由路径不能为空')
    .matches(/^\/[a-zA-Z0-9_\-/]*$/)
    .withMessage('路由路径必须以/开头，只能包含字母、数字、下划线、横线和斜杠')
    .trim(),

  body('component').notEmpty().withMessage('组件路径不能为空').trim(),

  body('title').notEmpty().withMessage('菜单标题不能为空').trim(),

  body('icon').optional().trim(),

  body('sort').optional().isInt({ min: 0 }).withMessage('排序值不能小于0').toInt(),

  body('pid').optional().isMongoId().withMessage('无效的父级ID'),

  body('type').optional().isIn(['menu', 'button', 'iframe']).withMessage('类型必须是 menu、button 或 iframe'),

  body('hidden').optional().isBoolean().withMessage('hidden 必须是布尔值').toBoolean(),

  body('permissions').optional().isArray().withMessage('permissions 必须是数组'),
  utils.handleValidationErrors,
];
