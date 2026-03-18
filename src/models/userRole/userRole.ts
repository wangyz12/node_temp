// src/models/userRole.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IUserRole extends Document {
  userId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const userRoleSchema = new Schema<IUserRole>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// 联合唯一索引
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });

export const UserRoleModel = mongoose.models.UserRole ? mongoose.model<IUserRole>('UserRole') : mongoose.model<IUserRole>('UserRole', userRoleSchema);
