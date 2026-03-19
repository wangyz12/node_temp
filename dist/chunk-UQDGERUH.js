// src/models/users/users.ts
import mongoose, { Schema, Types } from "mongoose";

// src/utils/bcrypt.ts
import bcrypt from "bcrypt";
var BcryptUtil = class {
  // 盐的轮数，默认10（越高越安全，但越慢）
  static SALT_ROUNDS = 10;
  /**
   * 加密密码
   * @param password - 明文密码
   * @returns 返回加密后的哈希值
   */
  static async hash(password) {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error(`\u5BC6\u7801\u52A0\u5BC6\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * 同步方式加密密码
   */
  static hashSync(password) {
    try {
      const salt = bcrypt.genSaltSync(this.SALT_ROUNDS);
      return bcrypt.hashSync(password, salt);
    } catch (error) {
      throw new Error(`\u5BC6\u7801\u52A0\u5BC6\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * 验证密码
   * @param password - 明文密码
   * @param hash - 加密后的哈希值
   * @returns 返回布尔值，true表示密码正确
   */
  static async verify(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error(`\u5BC6\u7801\u9A8C\u8BC1\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * 同步方式验证密码
   */
  static verifySync(password, hash) {
    try {
      return bcrypt.compareSync(password, hash);
    } catch (error) {
      throw new Error(`\u5BC6\u7801\u9A8C\u8BC1\u5931\u8D25: ${error.message}`);
    }
  }
};
var bcryptUtil = BcryptUtil;

// src/models/users/users.ts
var DEFAULT_DEPT_ID = new Types.ObjectId("000000000000000000000001");
var userSchema = new Schema(
  {
    account: {
      type: String,
      required: [true, "\u8D26\u53F7\u4E0D\u80FD\u4E3A\u7A7A"],
      unique: true,
      trim: true,
      minlength: [2, "\u8D26\u53F7\u957F\u5EA6\u4E0D\u80FD\u5C0F\u4E8E2"],
      maxlength: [50, "\u8D26\u53F7\u957F\u5EA6\u4E0D\u80FD\u5927\u4E8E50"]
    },
    password: {
      type: String,
      required: [true, "\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A"],
      select: false
    },
    username: {
      type: String,
      trim: true,
      minlength: [2, "\u59D3\u540D\u957F\u5EA6\u4E0D\u80FD\u5C0F\u4E8E2"],
      maxlength: [50, "\u59D3\u540D\u957F\u5EA6\u4E0D\u80FD\u5927\u4E8E50"],
      default: "\u9ED8\u8BA4\u7528\u6237"
    },
    // 👇 新增：所属部门ID（替代原来的 employeeId 和 department）
    deptId: {
      type: Schema.Types.ObjectId,
      ref: "Dept",
      // required: [true, '所属部门不能为空'],
      default: DEFAULT_DEPT_ID,
      // 设置默认值
      index: true
    },
    avatar: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      default: "",
      validate: {
        validator: function(v) {
          return !v || /^1[3-9]\d{9}$/.test(v);
        },
        message: "\u624B\u673A\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E"
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      default: "",
      validate: {
        validator: function(v) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: "\u90AE\u7BB1\u683C\u5F0F\u4E0D\u6B63\u786E"
      }
    },
    // 用户状态：0-正常，1-停用
    status: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    },
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      }
    },
    toObject: {
      transform: function(doc, ret) {
        delete ret.password;
        delete ret.__v;
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      }
    }
  }
);
userSchema.pre("validate", function() {
  if (this.email === "") {
    this.email = void 0;
  }
  if (this.phone === "") {
    this.phone = void 0;
  }
});
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  try {
    this.password = await bcryptUtil.hash(this.password);
  } catch (error) {
    throw error;
  }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcryptUtil.verify(candidatePassword, this.password);
};
userSchema.methods.incrementTokenVersion = async function() {
  this.tokenVersion += 1;
  await this.save();
};
var UserModel = mongoose.models.User ? mongoose.model("User") : mongoose.model("User", userSchema);

export {
  UserModel
};
