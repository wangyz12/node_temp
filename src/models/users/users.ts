// src/models/users/users.ts
import mongoose, { Schema, Document, CallbackError } from 'mongoose';
import { bcryptUtil } from '@/utils/bcrypt.ts'; // 改为导入 bcrypt

export interface IUser extends Document {
  account: string;
  password: string;
  username: string;
  employeeId?: string;
  department?: string;
  roles: string[];
  avatar?: string;
  phone?: string;
  email?: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>; // 改为异步
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
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: '',
      minlength: [2, '工号长度不能小于2'],
      maxlength: [20, '工号长度不能大于20'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [50, '部门名称不能大于50'],
    },
    roles: {
      type: [String],
      default: ['employee'],
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
        delete ret.password;
        delete ret.__v;

        // 确保 _id 被转换为 id
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

// ✅ 修正：移除 next 参数，不调用 next()
userSchema.pre('validate', function (this: IUser) {
  if (this.email === '') {
    this.email = undefined;
  }
  if (this.phone === '') {
    this.phone = undefined;
  }
  if (this.employeeId === '') {
    this.employeeId = undefined;
  }
});

// 👇 修改：使用 bcrypt 加密密码（异步）
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;
  try {
    // 使用 bcrypt 异步加密
    this.password = await bcryptUtil.hash(this.password);
  } catch (error) {
    throw error;
  }
});

// 👇 修改：验证密码方法改为异步
userSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  return await bcryptUtil.verify(candidatePassword, this.password);
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
