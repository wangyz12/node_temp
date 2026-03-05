import { body } from 'express-validator';
const updateUserInfo = [
  body('username')
    .optional()
    .isLength({ min: 2, max: 30 })
    .withMessage('姓名长度在2-50之间')
    .trim(),
  body('avatar').optional().isURL().withMessage('头像地址不正确').trim(),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('手机号输入不正确')
    .trim(),
  body('email').optional().isEmail().withMessage('邮箱格式不正确').trim(),
  body('department').optional().isLength({ max: 50 }).withMessage('部门名称不能超过50字').trim(),
  body('employeeId')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('工号长度在2-20之间')
    .trim(),
];

export default { updateUserInfo };
