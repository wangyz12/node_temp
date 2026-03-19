// src/models/userRole/userRole.ts
import mongoose, { Schema } from "mongoose";
var userRoleSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
userRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });
var UserRoleModel = mongoose.models.UserRole ? mongoose.model("UserRole") : mongoose.model("UserRole", userRoleSchema);

export {
  UserRoleModel
};
