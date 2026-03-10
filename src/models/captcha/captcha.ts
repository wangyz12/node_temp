// src/models/captcha.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICaptcha extends Document {
  uuid: string;
  value: string; // 验证码值
  type: 'math' | 'char';
  expiresAt: Date;
  createdAt: Date;
}

const captchaSchema = new Schema<ICaptcha>(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['math', 'char'],
      default: 'math',
    },
    expiresAt: {
      type: Date,
      required: true,
      // 删除 index: true，因为下面已经定义了 TTL 索引
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// 自动过期（MongoDB TTL索引）- 保留这个
captchaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CaptchaModel = mongoose.models.Captcha ? mongoose.model<ICaptcha>('Captcha') : mongoose.model<ICaptcha>('Captcha', captchaSchema);
