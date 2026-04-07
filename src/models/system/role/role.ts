// src/models/role.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  name: string; // 角色名称（如：admin、manager、employee）
  label: string; // 角色标签（如：管理员、经理、员工）
  dataScope: '1' | '2' | '3' | '4' | '5'; // 数据权限范围
  // 1: 全部数据权限（总公司）
  // 2: 自定义数据权限（指定部门）
  // 3: 本部门数据权限（分公司）
  // 4: 本部门及以下数据权限
  // 5: 仅本人数据权限
  status: '0' | '1'; // 状态（0正常 1停用）
  delFlag: '0' | '1'; // 删除标志（0正常 1已删除）
  remark?: string; // 备注
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: [true, '角色名称不能为空'],
      unique: true,
      trim: true,
      minlength: [2, '角色名称长度不能小于2'],
      maxlength: [30, '角色名称长度不能大于30'],
    },
    label: {
      type: String,
      required: [true, '角色标签不能为空'],
      trim: true,
    },
    dataScope: {
      type: String,
      enum: ['1', '2', '3', '4', '5'],
      default: '3', // 默认本部门数据权限
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
    remark: {
      type: String,
      maxlength: [200, '备注不能超过200字'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      },
    },
  }
);

// 索引
roleSchema.index({ name: 1 });

export const RoleModel = mongoose.models.Role ? mongoose.model<IRole>('Role') : mongoose.model<IRole>('Role', roleSchema);
