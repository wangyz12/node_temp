// src/models/users/users.ts
import mongoose, { CallbackError, Document, Schema, Types } from 'mongoose';

import { bcryptUtil } from '@/utils/bcrypt.ts';

export interface IUser extends Document {
  account: string;
  password: string;
  username: string;
  deptId: Types.ObjectId; // 所属部门ID（必填）- 替代原来的 department
  avatar?: string;
  phone?: string;
  email?: string;
  status: string; // 用户状态：0-正常，1-停用
  tokenVersion: number;
  roles?: any;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementTokenVersion(): Promise<void>;
}
// 创建一个默认的部门ID（可以使用固定的ObjectId）
const DEFAULT_DEPT_ID = new Types.ObjectId('000000000000000000000001'); // 临时默认部门ID
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
    // 👇 新增：所属部门ID（替代原来的 employeeId 和 department）
    deptId: {
      type: Schema.Types.ObjectId,
      ref: 'Dept',
      // required: [true, '所属部门不能为空'],
      default: DEFAULT_DEPT_ID, // 设置默认值
      index: true,
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
    // 用户状态：0-正常，1-停用
    status: {
      type: String,
      enum: ['0', '1'],
      default: '0',
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
        delete ret.password;
        delete ret.__v;

        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }

        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret: any) {
        delete ret.password;
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

// 预处理中间件 - 处理空字符串
userSchema.pre('validate', function (this: IUser) {
  if (this.email === '') {
    this.email = undefined;
  }
  if (this.phone === '') {
    this.phone = undefined;
  }
});

// 密码加密中间件
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;
  try {
    this.password = await bcryptUtil.hash(this.password);
  } catch (error) {
    throw error;
  }
});

// 实例方法：验证密码
userSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  return bcryptUtil.verify(candidatePassword, this.password);
};

// 实例方法：增加 token 版本号
userSchema.methods.incrementTokenVersion = async function (this: IUser): Promise<void> {
  this.tokenVersion += 1;
  await this.save();
};

// 导出模型
export const UserModel = mongoose.models.User ? mongoose.model<IUser>('User') : mongoose.model<IUser>('User', userSchema);
