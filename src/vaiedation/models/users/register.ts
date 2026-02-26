import { body, validationResult } from 'express-validator';
// 注册验证规则
const register = [
  // 账号验证
  body('account')
    .notEmpty()
    .withMessage('账号不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('账号长度在2-50之间')
    .trim(),

  // 密码验证
  body('password')
    .notEmpty()
    .withMessage('密码不能为空')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*_)[a-zA-Z0-9_]+$/)
    .withMessage('密码必须包含字母、数字和下划线')
    .isLength({ min: 2, max: 50 })
    .withMessage('密码长度在2-50之间')
    .trim(),
];

// 验证结果处理中间件
const handleValidationErrors = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
export default { register, handleValidationErrors };
