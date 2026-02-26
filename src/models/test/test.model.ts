import mongoose, { Schema, Document } from 'mongoose';

/**
 * 用户接口
 * 继承 mongoose 的 Document，获得 _id 等内置字段
 */
export interface IUsers extends Document {
  name: string; // 姓名
  email: string; // 邮箱（唯一）
  age?: number; // 年龄（可选）
  createdAt: Date; // 创建时间（由 timestamps 自动生成）
  updatedAt: Date; // 更新时间（由 timestamps 自动生成）
}

/**
 * User Schema
 * 定义 MongoDB 中文档的结构和验证规则
 */
const textSchema = new Schema<IUsers>(
  {
    name: {
      type: String,
      required: [true, '姓名是必填项'], // 必填，自定义错误信息
      trim: true, // 自动去除首尾空格
      maxlength: [50, '姓名不能超过50个字符'], // 最大长度限制
      minlength: [2, '姓名至少需要2个字符'], // 最小长度限制
    },
    email: {
      type: String,
      required: [true, '邮箱是必填项'],
      unique: true, // 唯一索引，确保邮箱不重复
      lowercase: true, // 自动转换为小写
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '邮箱格式不正确'], // 正则表达式验证邮箱格式
    },
    age: {
      type: Number,
      min: [0, '年龄不能小于0'], // 最小值验证
      max: [120, '年龄不能超过120'], // 最大值验证
      validate: {
        validator: (value: number) => Number.isInteger(value), // 验证是否为整数
        message: '年龄必须是整数',
      },
    },
  },
  {
    timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
    versionKey: '__v', // 版本控制字段，默认为 __v
  }
);

/**
 * 创建 Model
 * mongoose.model(模型名称, Schema, 集合名称)
 * 如果不指定第三个参数，MongoDB 会自动将模型名称转为复数作为集合名
 * 这里会自动使用 'users' 作为集合名
 */
export const testModel = mongoose.model<IUsers>('Test', textSchema);
