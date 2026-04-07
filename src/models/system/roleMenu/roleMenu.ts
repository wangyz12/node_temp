// src/models/roleMenu.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRoleMenu extends Document {
  roleId: mongoose.Types.ObjectId;
  menuId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const roleMenuSchema = new Schema<IRoleMenu>(
  {
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    menuId: {
      type: Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// 联合唯一索引
roleMenuSchema.index({ roleId: 1, menuId: 1 }, { unique: true });

export const RoleMenuModel = mongoose.models.RoleMenu ? mongoose.model<IRoleMenu>('RoleMenu') : mongoose.model<IRoleMenu>('RoleMenu', roleMenuSchema);
