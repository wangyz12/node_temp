// src/models/dept.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IDept extends Document {
  name: string; // 部门名称（如：总公司、北京分公司）
  code: string; // 部门编码（唯一）
  parentId: mongoose.Types.ObjectId | null; // 父级部门ID
  ancestors: string; // 所有父级ID路径（如：,0,id1,id2,）
  orderNum: number; // 显示顺序
  leader?: string; // 负责人
  phone?: string; // 联系电话
  email?: string; // 邮箱
  status: '0' | '1'; // 状态（0正常 1停用）
  delFlag: '0' | '1'; // 删除标志（0正常 1已删除）
  createdAt: Date;
  updatedAt: Date;
}

const deptSchema = new Schema<IDept>(
  {
    name: {
      type: String,
      required: [true, '部门名称不能为空'],
      trim: true,
      maxlength: [50, '部门名称不能超过50'],
    },
    code: {
      type: String,
      required: [true, '部门编码不能为空'],
      unique: true,
      trim: true,
      maxlength: [30, '部门编码不能超过30'],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Dept',
      default: null,
    },
    ancestors: {
      type: String,
      default: '',
    },
    orderNum: {
      type: Number,
      default: 0,
    },
    leader: {
      type: String,
      trim: true,
      maxlength: [20, '负责人姓名不能超过20'],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^1[3-9]\d{9}$/.test(v);
        },
        message: '手机号格式不正确',
      },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: '邮箱格式不正确',
      },
    },
    status: {
      type: String,
      enum: ['0', '1'],
      default: '0',
    },
    delFlag: {
      type: String,
      enum: ['0', '1'],
      default: '0',
    },
  },
  {
    timestamps: true,
    // ✅ 添加 toJSON 转换器
    toJSON: {
      transform: function (doc, ret: any) {
        // 删除不需要的字段
        delete ret.__v;

        // 将 _id 转换为 id
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }

        // 如果 parentId 存在，也转换为字符串
        if (ret.parentId) {
          ret.parentId = ret.parentId.toString();
        }

        return ret;
      },
    },
    // ✅ 添加 toObject 转换器（可选）
    toObject: {
      transform: function (doc, ret: any) {
        delete ret.__v;

        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }

        if (ret.parentId) {
          ret.parentId = ret.parentId.toString();
        }

        return ret;
      },
    },
  }
);

// 统一在这里创建需要的索引
deptSchema.index({ parentId: 1 }); // 用于查询子部门

export const DeptModel = mongoose.models.Dept ? mongoose.model<IDept>('Dept') : mongoose.model<IDept>('Dept', deptSchema);
