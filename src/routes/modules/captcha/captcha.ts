// src/routes/captcha.routes.ts
import { Router } from 'express';

import captchaController from '@/controller/modules/system/captcha/captcha';
import { RateLimiterUtil } from '@/utils/rateLimiter.ts';

const router = Router();

// 获取验证码（需要限流，防止刷验证码）
router.get('/getCaptcha', captchaController.getCaptcha);

// 验证验证码
router.post('/verify', captchaController.verifyCaptcha);

// 刷新验证码
router.post('/refresh', captchaController.refreshCaptcha);

// 检查验证码状态
router.get('/status/:uuid', captchaController.checkCaptchaStatus);

export default router;
