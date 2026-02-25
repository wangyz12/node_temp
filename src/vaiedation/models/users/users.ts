import { body, validationResult } from 'express-validator';

// 创建用户时的验证规则
const validateCreateUser = [
  // 验证 name
  body('name')
    .notEmpty()
    .withMessage('姓名不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度在2-50之间')
    .trim(),

  // 验证 email
  body('email')
    .notEmpty()
    .withMessage('邮箱不能为空')
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(), // 自动转为小写

  // 验证 age（可选）
  body('age').optional().isInt({ min: 0, max: 120 }).withMessage('年龄必须是0-120之间的整数'),

  // 验证结果处理
  (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

export default {
  validateCreateUser,
};
