

# Node.js Express MongoDB 项目模板

一个基于 Express + TypeScript + MongoDB 的后端项目模板，提供完整的用户认证、接口验证、日志管理等功能。

## 功能特性

- **Express + TypeScript** - 使用 TypeScript 开发，提供类型安全
- **MongoDB 连接** - 单例模式的 MongoDB 连接管理
- **用户认证** - 注册、登录、修改密码、退出登录
- **JWT 认证** - 基于 JWT 的身份验证中间件
- **接口验证** - 请求参数的验证与处理
- **日志管理** - 每日日志记录，自动清理过期日志
- **优雅关闭** - 支持进程优雅退出

## 技术栈

- Node.js
- Express
- TypeScript
- MongoDB / Mongoose
- JWT
- ESLint + Prettier

## 项目结构

```
src/
├── app.ts                 # Express 应用配置
├── server.ts              # 服务入口文件
├── config/
│   ├── env.ts             # 环境变量配置
│   └── mongodb.ts         # MongoDB 连接管理
├── controller/
│   ├── index.ts           # 控制器导出
│   └── modules/
│       ├── test/          # 测试相关控制器
│       └── users/         # 用户相关控制器
├── middlewares/
│   ├── auth.ts            # 认证中间件
│   └── logger.ts          # 日志中间件
├── models/
│   ├── index.ts           # 模型导出
│   └── modules/
│       ├── test/          # 测试模型
│       └── users/         # 用户模型
├── routes/
│   ├── index.ts           # 路由导出
│   └── modules/
│       ├── test/          # 测试路由
│       └── users/         # 用户路由
├── utils/
│   ├── global.ts          # 全局工具
│   ├── jwt.ts             # JWT 工具
│   ├── logger.ts          # 日志工具
│   ├── md5.ts             # MD5 加密
│   ├── userToken.ts       # 用户 Token 工具
│   └── utils.ts           # 通用工具
├── vaiedation/
│   ├── index.ts           # 验证器导出
│   └── models/
│       ├── test/          # 测试验证
│       └── users/         # 用户验证
└── types/
    ├── environment.d.ts   # 环境变量类型
    └── global/            # 全局类型定义
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

| 方法   | 路径           | 描述     |
|--------|----------------|----------|
| POST   | /api/users/register | 用户注册 |
| POST   | /api/users/login     | 用户登录 |
| POST   | /api/users/updatePassword | 修改密码 |
| POST   | /api/users/updateUserInfo | 更新用户信息 |
| POST   | /api/users/logout    | 退出登录 |

### 测试接口

| 方法   | 路径           | 描述     |
|--------|----------------|----------|
| GET    | /api/test      | 测试查询 |
| POST   | /api/test      | 创建测试 |

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