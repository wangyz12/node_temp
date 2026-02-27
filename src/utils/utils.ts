import { validationResult } from 'express-validator';

// 验证结果处理中间件
const handleValidationErrors = (req: ExpressRequest, res: ExpressResponse, next: ExpressNext) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('数据错误', errors.array());
    return res.status(200).json({
      code: 1000,
      msg: '数据错误',
      errors: errors.array().map((err: any) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

export default {
  handleValidationErrors,
};
