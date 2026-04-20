/**
 * 验证码控制器
 *
 * 负责处理验证码相关的HTTP请求，包括：
 * - 生成验证码图片
 * - 验证验证码
 *
 * @module CaptchaController
 */

import { CaptchaUtil } from '@/utils/captcha';
import type { ExpressRequest, ExpressResponse } from '@/types/express';
import { handleError, successResponse, checkRequiredParams } from '@/utils/errorHandler';

// ==================== 控制器方法 ====================

/**
 * 获取验证码
 * @route GET /api/captcha
 * @query {string} type - 验证码类型（char: 字符验证码, math: 数学验证码）
 * @query {string} uuid - 旧的验证码UUID（可选，用于替换旧验证码）
 * @returns {object} 验证码数据（包含UUID和图片）
 */
const getCaptcha = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { type = 'char', uuid } = req.query;

    // 如果有uuid，先主动删除旧的验证码缓存
    if (uuid && typeof uuid === 'string') {
      console.log(`主动删除旧验证码: ${uuid}`);
      CaptchaUtil.remove(uuid);
    }

    let result: any;
    if (type === 'math') {
      result = CaptchaUtil.generateMathCaptcha();
    } else {
      result = CaptchaUtil.generateCharCaptcha();
    }

    successResponse(
      res,
      {
        uuid: result.uuid,
        image: result.image, // SVG格式
        ...(result.expression && { expression: result.expression }), // 数学表达式
      },
      '验证码生成成功'
    );
  } catch (error: any) {
    handleError(error, res, '验证码生成失败');
  }
};

/**
 * 验证验证码
 * @route POST /api/captcha/verify
 * @param {string} uuid - 验证码UUID
 * @param {string} code - 用户输入的验证码
 * @returns {object} 验证结果
 */
const verifyCaptcha = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { uuid, code } = req.body;
    checkRequiredParams({ uuid, code }, ['uuid', 'code']);

    const isValid = CaptchaUtil.verify(uuid, code);

    successResponse(
      res,
      {
        valid: isValid,
        message: isValid ? '验证码正确' : '验证码错误',
      },
      isValid ? '验证成功' : '验证失败'
    );
  } catch (error: any) {
    handleError(error, res, '验证码验证失败');
  }
};

/**
 * 刷新验证码（获取新验证码并失效旧验证码）
 * @route POST /api/captcha/refresh
 * @param {string} uuid - 旧的验证码UUID
 * @returns {object} 新的验证码数据
 */
const refreshCaptcha = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { uuid } = req.body;

    // 如果提供了旧UUID，先删除
    if (uuid) {
      CaptchaUtil.remove(uuid);
    }

    const result = CaptchaUtil.generateCharCaptcha();

    successResponse(
      res,
      {
        uuid: result.uuid,
        image: result.image,
      },
      '验证码刷新成功'
    );
  } catch (error: any) {
    handleError(error, res, '验证码刷新失败');
  }
};

/**
 * 检查验证码状态
 * @route GET /api/captcha/status/:uuid
 * @param {string} uuid - 验证码UUID
 * @returns {object} 验证码状态信息
 */
const checkCaptchaStatus = async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { uuid } = req.params;
    checkRequiredParams({ uuid }, ['uuid']);

    const exists = CaptchaUtil.exists(uuid as string);
    const expiresIn = CaptchaUtil.getExpiresIn(uuid as string);

    successResponse(
      res,
      {
        exists,
        expiresIn,
        message: exists ? '验证码有效' : '验证码不存在或已过期',
      },
      '检查完成'
    );
  } catch (error: any) {
    handleError(error, res, '检查验证码状态失败');
  }
};

export default {
  getCaptcha,
  verifyCaptcha,
  refreshCaptcha,
  checkCaptchaStatus,
};
