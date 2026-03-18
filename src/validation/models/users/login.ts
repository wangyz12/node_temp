import { body } from 'express-validator';

// 登录验证规则
export const login = [
  // 账号验证
  body('account')
    .notEmpty()
    .withMessage('账号不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('账号长度在2-50之间')
    .trim(),

  // 密码验证（登录时不验证格式，只验证非空）
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .trim(),

  // 验证码UUID
  body('uuid')
    .notEmpty()
    .withMessage('验证码UUID不能为空')
    .trim(),

  // 验证码
  body('code')
    .notEmpty()
    .withMessage('验证码不能为空')
    .trim(),
];

export default { login };