// src/models/roleDept.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRoleDept extends Document {
  roleId: mongoose.Types.ObjectId;
  deptId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const roleDeptSchema = new Schema<IRoleDept>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    deptId: {
      type: Schema.Types.ObjectId,
      ref: 'Dept',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// 联合唯一索引
roleDeptSchema.index({ roleId: 1, deptId: 1 }, { unique: true });

export const RoleDeptModel = mongoose.models.RoleDept ? mongoose.model<IRoleDept>('RoleDept') : mongoose.model<IRoleDept>('RoleDept', roleDeptSchema);
