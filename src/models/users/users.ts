// src/models/users/users.ts
import mongoose, { Schema, Document } from 'mongoose';
import { MD5Util } from '@/utils/md5.ts';
export interface IUser extends Document {
  account: string;
  password: string;
  username: string;
  employeeId?: string; // 工号
  department?: string; // 部门
  roles: string[]; // 角色
  avatar?: string;
  phone?: string;
  email?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): boolean;
  incrementTokenVersion(): Promise<void>;
}

const userSchema = new Schema<IUser>(
  {
    account: {
      type: String,
      required: [true, '账号不能为空'],
      unique: true,
      trim: true,
      minlength: [2, '账号长度不能小于2'],
      maxlength: [50, '账号长度不能大于50'],
    },
    password: {
      type: String,
      required: [true, '密码不能为空'],
      select: false,
    },
    username: {
      type: String,
      trim: true,
      minlength: [2, '姓名长度不能小于2'],
      maxlength: [50, '姓名长度不能大于50'],
      default: '默认用户',
    },
    // 👇 新增：工号
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // 允许为空，但如果有值则必须唯一
      minlength: [2, '工号长度不能小于2'],
      maxlength: [20, '工号长度不能大于20'],
    },
    // 👇 新增：部门
    department: {
      type: String,
      trim: true,
      maxlength: [50, '部门名称不能大于50'],
    },
    // 👇 新增：角色（使用枚举）
    roles: {
      type: [String], // 改为数组
      default: ['employee'], // 默认为数组包含普通员工
      required: [true, '角色不能为空'],
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: '',
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
      sparse: true,
      unique: true,
      default: '',
      validate: {
        validator: function (v: string) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: '邮箱格式不正确',
      },
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.password; // 👈 确保序列化时删除密码
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

// ✅ 修正：使用 async 函数，不调用 next
userSchema.pre('save', async function (this: IUser) {
  // 只有密码被修改时才重新加密
  if (!this.isModified('password')) return;

  try {
    // 使用 MD5 加密
    this.password = MD5Util.hash(this.password);
  } catch (error) {
    throw error; // 直接抛出错误
  }
});

/**
 * 实例方法：验证密码
 */
userSchema.methods.comparePassword = function (this: IUser, candidatePassword: string): boolean {
  return MD5Util.hash(candidatePassword) === this.password;
};

/**
 * 实例方法：增加 token 版本号
 */
userSchema.methods.incrementTokenVersion = async function (this: IUser): Promise<void> {
  this.tokenVersion += 1;
  await this.save();
};

// 导出模型
export const UserModel = mongoose.models.User ? mongoose.model<IUser>('User') : mongoose.model<IUser>('User', userSchema);
