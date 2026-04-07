# Node.js Express MongoDB 项目模板

一个基于 Express + TypeScript + MongoDB 的后端项目模板，提供完整的用户认证、接口验证、日志管理等功能。

**后端仓库地址：** https://gitee.com/W_admin_code/node_temp

**前端仓库地址：** https://gitee.com/W_admin_code/my_admin

**演示地址：** https://temp-code.top/

## 功能特性

- **Express + TypeScript** - 使用 TypeScript 开发，提供类型安全
- **MongoDB 连接** - 单例模式的 MongoDB 连接管理
- **用户认证** - 注册、登录、修改密码、退出登录
- **JWT 认证** - 基于 JWT 的身份验证中间件
- **接口验证** - 请求参数的验证与处理
- **日志管理** - 每日日志记录，自动清理过期日志
- **优雅关闭** - 支持进程优雅退出
- **RBAC 权限** - 基于角色的访问控制
- **数据权限控制** - 支持5种权限等级（全部/自定义/本部门/本部门及以下/仅本人）
- **验证码系统** - 图形验证码功能

## 技术栈

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- JWT
- ESLint + Prettier

## 项目结构

```
node_temp/
├── src/                           # 源代码目录
│   ├── app.ts                     # Express应用配置
│   ├── server.ts                  # 服务入口文件
│   ├── config/                    # 配置文件
│   │   ├── env.ts                 # 环境变量配置
│   │   ├── mongodb.ts             # MongoDB连接管理
│   │   └── security.ts            # 安全配置
│   ├── constants/                 # 常量定义
│   │   ├── httpStatus.ts          # HTTP状态码
│   │   ├── index.ts               # 常量导出
│   │   ├── roles.ts               # 角色常量
│   │   └── userStatus.ts          # 用户状态常量
│   ├── controller/                # 控制器层
│   │   ├── index.ts               # 控制器导出
│   │   └── modules/               # 模块控制器
│   │       ├── system/            # 系统模块
│   │       │   ├── captcha/       # 验证码控制器
│   │       │   ├── dept/          # 部门控制器
│   │       │   ├── menu/          # 菜单控制器
│   │       │   ├── role/          # 角色控制器
│   │       │   ├── userRole/      # 用户角色控制器
│   │       │   └── users/         # 用户控制器
│   │       └── test/              # 测试控制器
│   ├── middlewares/               # 中间件层
│   │   ├── auth.ts                # 认证中间件
│   │   ├── dataScope.ts           # 数据权限中间件
│   │   ├── logger.ts              # 日志中间件
│   │   └── permission.ts          # 权限中间件
│   ├── models/                    # 数据模型层
│   │   ├── index.ts               # 模型导出
│   │   ├── system/                # 系统模型
│   │   │   ├── dept/              # 部门模型
│   │   │   ├── menu/              # 菜单模型
│   │   │   ├── role/              # 角色模型
│   │   │   ├── roleDept/          # 角色部门关联模型
│   │   │   ├── roleMenu/          # 角色菜单关联模型
│   │   │   ├── userRole/          # 用户角色关联模型
│   │   │   └── users/             # 用户模型
│   │   └── test/                  # 测试模型
│   ├── routes/                    # 路由层
│   │   ├── index.ts               # 路由导出
│   │   └── modules/               # 模块路由
│   │       ├── captcha/           # 验证码路由
│   │       ├── dept/              # 部门路由
│   │       ├── menu/              # 菜单路由
│   │       ├── role/              # 角色路由
│   │       ├── test/              # 测试路由
│   │       ├── userRole/          # 用户角色路由
│   │       └── users/             # 用户路由
│   ├── scripts/                   # 脚本目录
│   │   ├── initDatabase.ts        # 数据库初始化脚本
│   │   └── verifyDataScope.ts     # 数据权限验证脚本
│   ├── services/                  # 服务层
│   │   ├── index.ts               # 服务导出
│   │   └── system/                # 系统服务
│   │       ├── dept.service.ts    # 部门服务
│   │       ├── menu.service.ts    # 菜单服务
│   │       ├── role.service.ts    # 角色服务
│   │       ├── user.service.ts    # 用户服务
│   │       └── userRole.service.ts # 用户角色服务
│   ├── types/                     # 类型定义
│   │   └── express.ts             # Express类型扩展
│   ├── utils/                     # 工具函数
│   │   ├── bcrypt.ts              # 密码加密工具
│   │   ├── captcha.ts             # 验证码工具
│   │   ├── errorHandler.ts        # 错误处理工具
│   │   ├── global.ts              # 全局工具
│   │   ├── jwt.ts                 # JWT工具
│   │   ├── logger.ts              # 日志工具
│   │   └── rateLimiter.ts         # 限流工具
│   └── validation/                # 数据验证
│       └── models/                # 模型验证
│           ├── menu/              # 菜单验证
│           ├── test/              # 测试验证
│           └── users/             # 用户验证
├── devdoc/                        # 开发文档目录
│   └── DATA_SCOPE_ENHANCEMENT.md  # 数据权限增强文档
├── .env.example                   # 环境变量示例
├── .eslintrc.json                 # ESLint配置
├── .gitignore                     # Git忽略配置
├── .prettierrc                    # Prettier配置
├── DELIVERY_CHECKLIST.md          # 交付清单
├── README.md                      # 项目说明（本文档）
├── README.en.md                   # 英文项目说明
├── VERIFICATION_REPORT.md         # 验证报告
├── eslint.config.mjs              # ESLint模块配置
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript配置
└── tsconfig.node.json             # Node.js TypeScript配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 文件为 `.env`，并修改配置：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_database
JWT_SECRET=your_jwt_secret_key
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## API 接口

### 用户接口

| 方法   | 路径                      | 描述         |
| ------ | ------------------------- | ------------ |
| POST   | /api/users/register       | 用户注册     |
| POST   | /api/users/login          | 用户登录     |
| POST   | /api/users/updatePassword | 修改密码     |
| POST   | /api/users/updateUserInfo | 更新用户信息 |
| POST   | /api/users/logout         | 退出登录     |
| GET    | /api/users/list           | 获取用户列表 |
| GET    | /api/users/detail         | 获取用户详情 |
| POST   | /api/users/create         | 创建用户     |
| PUT    | /api/users/update         | 更新用户     |
| DELETE | /api/users/delete         | 删除用户     |
| POST   | /api/users/batchdelete    | 批量删除用户 |
| GET    | /api/users/current        | 获取当前用户 |

### 验证码接口

| 方法 | 路径                | 描述       |
| ---- | ------------------- | ---------- |
| GET  | /api/captcha        | 获取验证码 |
| POST | /api/captcha/verify | 验证验证码 |

### 部门接口

| 方法 | 路径      | 描述         |
| ---- | --------- | ------------ |
| GET  | /api/dept | 获取部门列表 |

### 菜单接口

| 方法   | 路径      | 描述         |
| ------ | --------- | ------------ |
| GET    | /api/menu | 获取菜单列表 |
| POST   | /api/menu | 创建菜单     |
| PUT    | /api/menu | 更新菜单     |
| DELETE | /api/menu | 删除菜单     |

### 角色接口

| 方法   | 路径      | 描述         |
| ------ | --------- | ------------ |
| GET    | /api/role | 获取角色列表 |
| POST   | /api/role | 创建角色     |
| PUT    | /api/role | 更新角色     |
| DELETE | /api/role | 删除角色     |

### 测试接口

| 方法 | 路径      | 描述     |
| ---- | --------- | -------- |
| GET  | /api/test | 测试查询 |
| POST | /api/test | 创建测试 |

## 日志说明

日志文件保存在 `logs` 目录下，按日期命名，默认保留 7 天。可通过 `SimpleLogger` 类配置：

```typescript
const logger = new SimpleLogger();
logger.setMaxAge(30); // 设置保留 30 天
logger.manualClean(); // 手动清理
```

## 开发规范

- 使用 ESLint 进行代码检查
- 使用 Prettier 格式化代码
- 遵循 TypeScript 类型规范

## 许可证

ISC
