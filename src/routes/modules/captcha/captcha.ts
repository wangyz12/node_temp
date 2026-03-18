// src/routes/captcha.routes.ts
import { Router } from 'express';

import { getCaptcha, verifyCaptcha } from '@/controller/modules/captcha/captcha';
import { RateLimiterUtil } from '@/utils/rateLimiter.ts';

const router = Router();

// 获取验证码（需要限流，防止刷验证码）
router.get('/getCaptcha', getCaptcha);

// 验证验证码（可选）
router.post('/verify', verifyCaptcha);

export default router;
