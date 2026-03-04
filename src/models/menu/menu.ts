import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoute extends Document {
  _id: mongoose.Types.ObjectId; // 路由ID
  pid: mongoose.Types.ObjectId | null; // 父级路由ID null表示顶级路由
  name: string; // 路由名称
  path: string; // 路由路径
  component: string; // 路由组件
  title: string; // 菜单标题
  icon: string; // 菜单图标
  sort: number; // 排序值
  type: 'menu' | 'button' | 'iframe'; // 类型 菜单 按钮 内嵌页面
  hidden: boolean; // 是否隐藏
  cache: boolean; // 是否缓存
  permissions?: string[]; // 所需权限标识
  external?: boolean; // 时候外联
  target?: '_blank' | '_self'; // 外联打开方式
  createAt: Date;
  updateAt: Date;
  children?: IRoute[]; // 虚拟字段 (用于树形结构)
  id?: string; // 添加 id 字段（可选，因为 transform 后会添加）
}

// 定义静态方法的接口
export interface IRouteModel extends Model<IRoute> {
  getTree(pid?: string | null): Promise<any[]>;
  getFullTree(): Promise<any[]>;
}

// 路由模型
const menuSchema = new Schema<IRoute, IRouteModel>(
  {
    pid: {
      type: Schema.Types.ObjectId,
      ref: 'Router', // 自关联
      default: null,
      index: true, // 添加索引
    },
    name: {
      type: String,
      required: [true, '路由名称不能为空'],
      unique: true, // 路由名称唯一
      trim: true,
      match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, '路由名称必须以字母开头，只能包含字母，数字，下划线'],
    },
    path: {
      type: String,
      required: [true, '路由路径不能为空'],
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^\/[a-zA-Z0-9_\-/]*$/.test(v);
        },
        message: '路由路径必须以/开头，只能包含字母、数字、下划线、横线和斜杠',
      },
    },
    component: {
      type: String,
      required: [true, '组件路径不能为空'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, '路由标题不能为空'],
      trim: true,
    },
    icon: {
      type: String,
      default: '',
    },
    sort: {
      type: Number,
      default: 0,
      min: [0, '排序值不能小于0'],
    },
    type: {
      type: String,
      enum: ['menu', 'button', 'iframe'],
      default: 'menu',
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    cache: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
    external: {
      type: Boolean,
      default: false,
    },
    target: {
      type: String,
      enum: ['_blank', '_self'],
      default: '_self',
    },
  },
  {
    timestamps: true, // 这会自动添加 createdAt 和 updatedAt 字段
    toJSON: {
      virtuals: true, // 启用虚拟字段
      transform: function (doc, ret: any) {
        delete ret.__v; // 删除版本号
        delete ret._id; // 删除 _id
        // 确保 id 存在
        if (doc._id) {
          ret.id = doc._id.toString();
        }
        return ret;
      },
    },
    toObject: {
      virtuals: true, // 启用虚拟字段
      transform: function (doc, ret: any) {
        delete ret.__v; // 删除版本号
        delete ret._id; // 删除 _id
        // 确保 id 存在
        if (doc._id) {
          ret.id = doc._id.toString();
        }
        return ret;
      },
    },
  }
);

// 虚拟字段：子路由，通过pid关联自身
menuSchema.virtual('children', {
  ref: 'menu',
  localField: '_id',
  foreignField: 'pid',
});

// 复合索引：提高按pid查询的性能
menuSchema.index({ pid: 1, sort: 1 });

// 确保同一父级下的路由名称不重复
menuSchema.index({ pid: 1, name: 1 }, { unique: true });

// 获取属性路由结构
menuSchema.statics.getTree = async function (pid: string | null = null) {
  const routes: any = await this.find({ pid }).sort('sort');
  const tree = [];
  for (const route of routes) {
    // 使用 toObject() 时会自动应用 transform
    const item = route.toObject();
    const children = await this.getTree(route._id.toString());
    if (children.length > 0) {
      item.children = children;
    }
    tree.push(item);
  }
  return tree;
};

/**
 * 获取完整的路由树（一次性查询优化版）
 */
menuSchema.statics.getFullTree = async function () {
  const allRoutes = await this.find().sort('sort').lean();

  const map = new Map();
  const tree: any[] = [];

  // 先将所有路由放入 Map
  allRoutes.forEach((route: any) => {
    const routeId = route._id.toString();
    const routePid = route.pid?.toString() || null;

    // 创建新对象，转换 _id 为 id
    const convertedRoute = {
      ...route,
      id: routeId,
      pid: routePid,
      children: [],
    };

    // 删除原始的 _id 和 __v
    delete convertedRoute._id;
    delete convertedRoute.__v;

    map.set(routeId, convertedRoute);
  });

  // 构建树形结构
  allRoutes.forEach((route: any) => {
    const id = route._id.toString();
    const pid = route.pid?.toString();

    if (pid && map.has(pid)) {
      map.get(pid).children.push(map.get(id));
    } else {
      tree.push(map.get(id));
    }
  });

  return tree;
};

// 导出模型
export const MenuModel = (mongoose.models.menu ? mongoose.model<IRoute>('Menu') : mongoose.model<IRoute, IRouteModel>('Menu', menuSchema)) as IRouteModel;
