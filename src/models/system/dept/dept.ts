// src/models/dept.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDept extends Document {
  name: string; // 部门名称（如：总公司、北京分公司）
  code: string; // 部门编码（唯一）
  parentId: mongoose.Types.ObjectId | null; // 父级部门ID
  ancestors: string; // 所有父级ID路径（如：,0,id1,id2,）
  level: number; // 部门层级（0为顶级部门）
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
    level: {
      type: Number,
      default: 0,
      min: [0, '部门层级不能小于0'],
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
      transform: function (_doc, ret: any) {
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
      transform: function (_doc, ret: any) {
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

// 保存前中间件：自动计算 ancestors 和 level
deptSchema.pre('save', async function (this: IDept & Document, next: (err?: any) => void) {
  try {
    // 如果是新部门或者父部门有变化
    if (this.isNew || this.isModified('parentId')) {
      if (this.parentId) {
        // 查询父部门
        const parentDept = await mongoose.model<IDept>('Dept').findById(this.parentId);
        if (parentDept) {
          // 构建 ancestors: 父部门的 ancestors + 逗号 + 父部门ID
          this.ancestors = `${parentDept.ancestors},${parentDept._id.toString()}`;
          this.level = parentDept.level + 1;
        } else {
          // 父部门不存在，设为顶级部门
          this.ancestors = `,${this._id.toString()}`;
          this.level = 0;
        }
      } else {
        // 没有父部门，设为顶级部门
        this.ancestors = `,${this._id.toString()}`;
        this.level = 0;
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// 更新前中间件：当父部门变化时，需要更新所有子部门的 ancestors 和 level
deptSchema.pre('findOneAndUpdate', async function (this: any, next: (err?: any) => void) {
  try {
    const update = this.getUpdate();

    // 如果更新了 parentId
    if (update && update.parentId !== undefined) {
      const docToUpdate = await this.model.findOne(this.getQuery());

      if (docToUpdate) {
        // 计算新的 ancestors 和 level
        let newAncestors = `,${docToUpdate._id.toString()}`;
        let newLevel = 0;

        if (update.parentId) {
          const parentDept = await mongoose.model<IDept>('Dept').findById(update.parentId);
          if (parentDept) {
            newAncestors = `${parentDept.ancestors},${docToUpdate._id.toString()}`;
            newLevel = parentDept.level + 1;
          }
        }

        // 更新当前部门
        update.$set = update.$set || {};
        update.$set.ancestors = newAncestors;
        update.$set.level = newLevel;

        // 递归更新所有子部门
        await updateChildrenAncestors(docToUpdate._id.toString(), newAncestors, newLevel + 1);
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// 递归更新子部门的 ancestors 和 level
async function updateChildrenAncestors(parentId: string, parentAncestors: string, baseLevel: number) {
  const children = await mongoose.model<IDept>('Dept').find({ parentId: new mongoose.Types.ObjectId(parentId) });

  for (const child of children) {
    const childAncestors = `${parentAncestors},${child._id.toString()}`;
    await mongoose.model<IDept>('Dept').findByIdAndUpdate(child._id, {
      $set: {
        ancestors: childAncestors,
        level: baseLevel,
      },
    });

    // 递归更新孙子部门
    await updateChildrenAncestors(child._id.toString(), childAncestors, baseLevel + 1);
  }
}

// 统一在这里创建需要的索引
deptSchema.index({ parentId: 1 }); // 用于查询子部门
deptSchema.index({ ancestors: 1 }); // 用于快速查询部门树
deptSchema.index({ level: 1 }); // 用于按层级查询

export const DeptModel = mongoose.models.Dept ? mongoose.model<IDept>('Dept') : mongoose.model<IDept>('Dept', deptSchema);
