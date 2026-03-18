// src/controllers/captcha.controller.ts
import { Request, Response } from 'express';

import { CaptchaUtil } from '@/utils/captcha.ts';

/**
 * 获取验证码
 * 若依风格：/captcha?type=math 或 /captcha?type=char
 */
export const getCaptcha = async (req: Request, res: Response) => {
  try {
    const { uuid } = req.query;
    // 1. 如果有uuid，先主动删除旧的验证码缓存
    if (uuid && typeof uuid === 'string') {
      console.log(`主动删除旧验证码: ${uuid}`);
      CaptchaUtil.remove(uuid); // 需要新增这个方法
    }
    const result: any = CaptchaUtil.generateCharCaptcha();
    // 返回数据
    res.json({
      code: 200,
      msg: 'success',
      data: {
        uuid: result.uuid,
        image: result.image, // SVG格式
        ...(result.expression && { expression: result.expression }), // 数学表达式
      },
    });
  } catch (error) {
    res.status(500).json({ code: 500, msg: '验证码生成失败' });
  }
};

/**
 * 验证验证码（通常登录时使用）
 */
export const verifyCaptcha = async (req: Request, res: Response) => {
  const { uuid, code } = req.body;

  const isValid = CaptchaUtil.verify(uuid, code);

  // 注意：这里不直接返回给前端，而是在登录接口中调用
  // 这个接口可以用于前端预验证
  res.json({
    code: isValid ? 200 : 400,
    msg: isValid ? '验证成功' : '验证码错误',
  });
};
