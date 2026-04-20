# My Admin - 企业级后台管理系统后端

一个基于 Express + TypeScript + MongoDB 构建的企业级后台管理系统后端，提供完整的用户认证、RBAC权限控制、数据权限管理、日志监控等功能。

**后端仓库地址：** https://gitee.com/W_admin_code/node_temp
**前端仓库地址：** https://gitee.com/W_admin_code/my_admin
**演示地址：** https://temp-code.top/

# 项目分支说明

本项目采用多分支策略，根据不同场景提供不同功能版本。

## 📦 分支概览

| 分支 | 说明 | 适用场景 |
| :--- | :--- | :--- |
| `master` | 基础 RBAC 版本 | 学习入门、快速开发 |
| `feature/data-scope` | 完整数据权限版本 | 企业级项目、需要数据隔离 |

---

## 🌿 master 分支

### 特点
- ✅ 用户-角色-菜单权限（RBAC）
- ✅ JWT 认证
- ✅ 按钮级权限控制
- ✅ 动态路由
- ✅ 基础查询功能
- ❌ 不包含 5 级数据权限

### 适用人群
- 学习 RBAC 原理的新手
- 需要快速搭建后台的开发者
- 对数据权限要求不高的项目

## 🌿 feature/data-scope 分支

### 特点
- ✅ 用户-角色-菜单权限（RBAC）
- ✅ JWT 认证
- ✅ 按钮级权限控制
- ✅ 动态路由
- ✅ 基础查询功能
- ✅ 不包含 5 级数据权限

### 适用人群
- 需要快速搭建后台的开发者
- 对数据权限要求高的项目


## 🚀 核心特性

### 🔐 安全认证
- **JWT 认证** - 基于 JSON Web Token 的无状态身份验证
- **图形验证码** - SVG 验证码防止暴力破解
- **密码加密** - Bcrypt 强哈希算法保护用户密码
- **安全中间件** - Helmet、XSS过滤、NoSQL注入防护

### 👥 权限管理
- **RBAC 模型** - 基于角色的访问控制（用户-角色-权限）
- **5级数据权限** - 支持全部/自定义/本部门/本部门及以下/仅本人数据权限
- **部门树形结构** - 支持无限层级部门管理
- **菜单权限** - 动态菜单权限控制

### 📊 数据管理
- **部门管理** - 树形部门结构，支持层级和路径优化
- **用户管理** - 完整的用户 CRUD 操作
- **角色管理** - 角色权限分配和管理
- **菜单管理** - 动态路由菜单配置

### 🛠️ 开发体验
- **TypeScript** - 完整的类型安全支持
- **ESLint + Prettier** - 统一的代码风格和规范
- **热重载开发** - 开发模式下自动重启
- **Docker 支持** - 容器化部署，多阶段构建优化

### 📈 运维监控
- **结构化日志** - 按日期分割的日志文件，自动清理
- **健康检查** - Docker 健康检查端点
- **优雅关闭** - 支持 SIGINT/SIGTERM 信号优雅退出
- **性能监控** - 请求限流和性能优化

## 🏗️ 技术栈

- **运行时**: Node.js 20+、Express 4.x
- **数据库**: MongoDB 6.0+、Mongoose ODM
- **开发语言**: TypeScript 5.9+
- **安全**: JWT、Bcrypt、Helmet、XSS、express-mongo-sanitize
- **工具链**: ESLint、Prettier、TSX、Tsup
- **部署**: Docker、Docker Compose
- **日志**: 自定义日志系统，支持按日期分割


## 📁 项目结构

```
node_temp/
├── src/                           # 源代码目录
│   ├── app.ts                     # Express应用配置（中间件、路由注册）
│   ├── server.ts                  # 服务入口（数据库连接、优雅关闭）
│   ├── config/                    # 配置文件
│   │   ├── env.ts                 # 环境变量验证和配置
│   │   ├── mongodb.ts             # MongoDB单例连接管理
│   │   └── security.ts            # 安全配置（Helmet、XSS、限流）
│   ├── constants/                 # 常量定义
│   │   ├── httpStatus.ts          # HTTP状态码常量
│   │   ├── index.ts               # 常量统一导出
│   │   ├── roles.ts               # 角色常量（admin、super_admin等）
│   │   ├── userStatus.ts          # 用户状态常量
│   │   └── permissions/           # 权限常量
│   │       ├── system.ts          # 系统管理权限
│   │       ├── business.ts        # 业务模块权限
│   │       ├── common.ts          # 通用权限
│   │       └── index.ts           # 权限统一导出
│   ├── controller/                # 控制器层（HTTP请求处理）
│   │   ├── index.ts               # 控制器统一导出
│   │   └── modules/               # 模块控制器
│   │       ├── system/            # 系统管理模块
│   │       │   ├── captcha/       # 验证码控制器
│   │       │   ├── dept/          # 部门控制器（树形结构）
│   │       │   ├── menu/          # 菜单控制器
│   │       │   ├── role/          # 角色控制器
│   │       │   ├── userRole/      # 用户角色关联控制器
│   │       │   └── users/         # 用户控制器
│   │       └── test/              # 测试控制器
│   ├── middlewares/               # 中间件层
│   │   ├── auth.ts                # JWT认证中间件
│   │   ├── dataScope.ts           # 数据权限中间件（5级权限控制）
│   │   ├── logger.ts              # 请求日志中间件
│   │   └── permission.ts          # 操作权限检查中间件
│   ├── models/                    # 数据模型层（Mongoose Schema）
│   │   ├── index.ts               # 模型统一导出
│   │   └── system/                # 系统数据模型
│   │       ├── dept/              # 部门模型（树形结构优化）
│   │       ├── menu/              # 菜单模型
│   │       ├── role/              # 角色模型
│   │       ├── roleDept/          # 角色-部门关联模型
│   │       ├── roleMenu/          # 角色-菜单关联模型
│   │       ├── userRole/          # 用户-角色关联模型
│   │       └── users/             # 用户模型
│   ├── routes/                    # 路由层
│   │   ├── index.ts               # 路由统一注册
│   │   └── modules/               # 模块路由
│   │       ├── captcha/           # 验证码路由
│   │       ├── dept/              # 部门路由
│   │       ├── menu/              # 菜单路由
│   │       ├── role/              # 角色路由
│   │       ├── test/              # 测试路由
│   │       ├── userRole/          # 用户角色路由
│   │       └── users/             # 用户路由
│   ├── scripts/                   # 脚本目录
│   │   ├── initDatabase.ts        # 数据库初始化脚本（创建管理员）
│   │   └── verifyDataScope.ts     # 数据权限功能验证脚本
│   ├── services/                  # 业务逻辑层
│   │   ├── index.ts               # 服务统一导出
│   │   └── system/                # 系统服务
│   │       ├── dept.service.ts    # 部门服务（树形结构操作）
│   │       ├── menu.service.ts    # 菜单服务
│   │       ├── role.service.ts    # 角色服务
│   │       ├── user.service.ts    # 用户服务
│   │       └── userRole.service.ts # 用户角色服务（数据权限计算）
│   ├── types/                     # TypeScript类型定义
│   │   ├── express.d.ts           # Express类型扩展
│   │   ├── environment.d.ts       # 环境变量类型
│   │   └── global/                # 全局类型定义
│   │       ├── express.ts         # Express请求响应类型
│   │       ├── helper.ts          # 工具类型
│   │       ├── index.ts           # 全局类型导出
│   │       └── register.ts        # 全局变量注册
│   ├── utils/                     # 工具函数
│   │   ├── bcrypt.ts              # 密码加密工具
│   │   ├── captcha.ts             # SVG验证码生成工具
│   │   ├── errorHandler.ts        # 统一错误处理工具
│   │   ├── global.ts              # 全局工具（logger等）
│   │   ├── initAdmin.ts           # 管理员初始化工具
│   │   ├── jwt.ts                 # JWT令牌工具
│   │   ├── logger.ts              # 结构化日志工具
│   │   ├── rateLimiter.ts         # 请求限流工具
│   │   ├── userToken.ts           # 用户令牌管理
│   │   └── utils.ts               # 通用工具函数
│   └── validation/                # 数据验证层
│       └── models/                # 模型验证规则
│           ├── menu/              # 菜单数据验证
│           ├── test/              # 测试数据验证
│           └── users/             # 用户数据验证
├── devDoc/                        # 开发文档
│   └── 数据权限功能增强文档.md    # 数据权限功能详细文档
├── logs/                          # 日志目录（按日期分割）
├── dist/                          # 构建输出目录
├── .env.example                   # 环境变量示例文件
├── .env.production                # 生产环境变量文件
├── .gitignore                     # Git忽略配置
├── .prettierrc                    # Prettier代码格式化配置
├── docker-compose.yml             # Docker Compose配置
├── dockerfile                     # Docker多阶段构建配置
├── eslint.config.mjs              # ESLint模块配置
├── package.json                   # 项目依赖和脚本配置
├── package-lock.json              # 依赖锁文件
├── README.md                      # 项目说明文档
├── README.en.md                   # 英文项目说明文档
├── tsconfig.json                  # TypeScript配置
└── tsup.config.ts                 # 构建工具配置
```

## 🚀 快速开始

### 前提条件
- 已安装 MongoDB 6.0+ 并确保服务已启动

### 一键启动

```bash
# 1. 克隆项目
git clone https://gitee.com/W_admin_code/node_temp.git
cd node_temp

# 2. 配置环境变量
cp .env.example .env.production
# 修改 JWT_SECRET 为随机字符串
# 修改 MONGODB_URI 为你的 MongoDB 地址

# 3. 启动服务
docker compose up -d

# 4. 查看服务状态
docker compose ps
```

### Docker Compose 服务说明

- **app**: Node.js 应用服务（端口 3000）
- **mongodb**: MongoDB 数据库服务（端口 27017）
- 自动配置网络连接
- 数据持久化到本地卷

## 💻 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

```bash
# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置以下关键项：
PORT=3000
MONGODB_URI=mongodb://localhost:27017/my_admin
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### 3. 数据库初始化

```bash
# 确保 MongoDB 服务已启动
# 初始化数据库（创建管理员用户）
npm run init-db
```

### 4. 启动开发服务器

```bash
# 开发模式（热重载）
npm run dev

# 访问地址：http://localhost:3000
```

### 5. 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务
npm start
```

## 🔧 开发脚本

```bash
# 代码检查
npm run lint

# 自动修复代码格式
npm run lint:fix

# TypeScript 类型检查
npm run type-check

# 代码格式化
npm run format
```

## 📡 API 接口文档

所有 API 接口均以 `/api` 为前缀，需要认证的接口需在请求头中添加 `Authorization: Bearer <token>`。

### 🔐 认证相关接口

| 方法 | 路径 | 描述 | 是否需要认证 |
|------|------|------|--------------|
| POST | `/api/users/register` | 用户注册 | ❌ |
| POST | `/api/users/login` | 用户登录 | ❌ |
| POST | `/api/users/logout` | 退出登录 | ✅ |
| POST | `/api/users/updatePassword` | 修改密码 | ✅ |
| GET  | `/api/users/current` | 获取当前用户信息 | ✅ |
| GET  | `/api/captcha` | 获取图形验证码 | ❌ |
| POST | `/api/captcha/verify` | 验证验证码 | ❌ |

### 👥 用户管理接口

| 方法 | 路径 | 描述 | 权限要求 |
|------|------|------|----------|
| GET  | `/api/users/list` | 获取用户列表（分页） | `system:user:list` |
| GET  | `/api/users/detail/:id` | 获取用户详情 | `system:user:query` |
| POST | `/api/users/create` | 创建用户 | `system:user:add` |
| PUT  | `/api/users/update/:id` | 更新用户 | `system:user:edit` |
| DELETE | `/api/users/delete/:id` | 删除用户 | `system:user:delete` |
| POST | `/api/users/batchdelete` | 批量删除用户 | `system:user:delete` |

### 🏢 部门管理接口

| 方法 | 路径 | 描述 | 权限要求 |
|------|------|------|----------|
| GET  | `/api/dept/tree` | 获取部门树形结构 | `system:dept:list` |
| GET  | `/api/dept/all` | 获取所有部门（下拉选择） | - |
| GET  | `/api/dept/detail/:id` | 获取部门详情 | `system:dept:query` |
| POST | `/api/dept/create` | 创建部门 | `system:dept:add` |
| PUT  | `/api/dept/update/:id` | 更新部门 | `system:dept:edit` |
| DELETE | `/api/dept/delete/:id` | 删除部门 | `system:dept:remove` |
| GET  | `/api/dept/stats` | 获取部门用户统计 | `system:dept:list` |

### 📋 菜单管理接口

| 方法 | 路径 | 描述 | 权限要求 |
|------|------|------|----------|
| GET  | `/api/menu/tree` | 获取菜单树形结构 | `system:menu:list` |
| GET  | `/api/menu/detail/:id` | 获取菜单详情 | `system:menu:query` |
| POST | `/api/menu/create` | 创建菜单 | `system:menu:add` |
| PUT  | `/api/menu/update/:id` | 更新菜单 | `system:menu:edit` |
| DELETE | `/api/menu/delete/:id` | 删除菜单 | `system:menu:remove` |

### 👑 角色管理接口

| 方法 | 路径 | 描述 | 权限要求 |
|------|------|------|----------|
| GET  | `/api/role/list` | 获取角色列表（分页） | `system:role:list` |
| GET  | `/api/role/detail/:id` | 获取角色详情 | `system:role:query` |
| POST | `/api/role/create` | 创建角色 | `system:role:add` |
| PUT  | `/api/role/update/:id` | 更新角色 | `system:role:edit` |
| DELETE | `/api/role/delete/:id` | 删除角色 | `system:role:remove` |

### 🔗 用户角色关联接口

| 方法 | 路径 | 描述 | 权限要求 |
|------|------|------|----------|
| GET  | `/api/userRole/user/:userId` | 获取用户角色列表 | `system:user:query` |
| POST | `/api/userRole/assign` | 分配用户角色 | `system:user:edit` |
| DELETE | `/api/userRole/remove` | 移除用户角色 | `system:user:edit` |

### 🧪 测试接口

| 方法 | 路径 | 描述 | 是否需要认证 |
|------|------|------|--------------|
| GET  | `/api/test` | 测试查询接口 | ❌ |
| POST | `/api/test` | 测试创建接口 | ❌ |

### 🩺 健康检查接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET  | `/health` | 服务健康状态检查 |
| GET  | `/health/db` | 数据库连接状态检查 |

## 🔐 数据权限系统

### 5级数据权限模型

系统支持5种数据权限等级，适用于不同的管理场景：

| 等级 | 代码 | 说明 | 适用角色 |
|------|------|------|----------|
| 1 | `全部数据权限` | 可查看所有部门的所有数据 | 超级管理员 |
| 2 | `自定义数据权限` | 可查看指定部门的数据 | 跨部门管理员 |
| 3 | `本部门数据权限` | 仅可查看本部门数据 | 部门主管 |
| 4 | `本部门及以下数据权限` | 可查看本部门及所有子部门数据 | 区域经理 |
| 5 | `仅本人数据权限` | 仅可查看自己创建的数据 | 普通员工 |

### 权限中间件使用

```typescript
// 在路由中应用数据权限中间件
router.get('/list', 
  authenticate,                    // 1. 用户认证
  checkPermission('system:user:list'), // 2. 操作权限检查
  dataScope(),                     // 3. 数据权限过滤
  userController.getUserList       // 4. 控制器处理
);

// 自定义字段别名
router.get('/dept-tree', 
  authenticate,
  dataScope({ 
    deptAlias: 'department',       // 部门字段别名
    createdByField: 'creatorId'    // 创建人字段别名
  }),
  deptController.getDeptTree
);
```

### 在服务层使用数据权限

```typescript
// 用户服务示例
async getUserList(query: any, dataScope?: any) {
  const conditions: any = {};
  
  // 搜索条件
  if (query.keyword) {
    conditions.$or = [
      { account: new RegExp(query.keyword, 'i') },
      { username: new RegExp(query.keyword, 'i') }
    ];
  }
  
  // 应用数据权限过滤
  if (dataScope?.filter) {
    Object.assign(conditions, dataScope.filter);
  }
  
  // 或者使用工具方法
  if (dataScope?.getQueryCondition) {
    const scopeCondition = dataScope.getQueryCondition('User');
    Object.assign(conditions, scopeCondition);
  }
  
  return await UserModel.find(conditions);
}
```

## 📊 日志系统

### 日志配置

日志文件保存在 `logs` 目录下，按日期自动分割（如 `2026-04-20.log`），默认保留 7 天。

```typescript
// 全局日志工具
import { logger } from '@/utils/global';

// 记录不同级别日志
logger.info('用户登录成功', { userId: '123', ip: '127.0.0.1' });
logger.warn('API调用频繁', { endpoint: '/api/users', count: 100 });
logger.error('数据库连接失败', { error: err.message });
logger.success('服务启动成功', { port: 3000, env: 'production' });
```

### 日志清理

```bash
# 手动清理过期日志
npm run clean-logs

# 配置日志保留天数（修改 .env）
LOG_MAX_AGE=30  # 保留30天
```

## 🛡️ 安全特性

### 多层安全防护

1. **HTTP安全头** - Helmet中间件提供11种安全头
2. **XSS防护** - 自动过滤请求中的恶意脚本
3. **NoSQL注入防护** - express-mongo-sanitize中间件
4. **请求限流** - 防止暴力破解和DDoS攻击
5. **JWT令牌** - 无状态认证，支持刷新机制
6. **密码加密** - Bcrypt强哈希算法
7. **CORS配置** - 严格的前端域名限制
8. **点击劫持防护** - X-Frame-Options头

### 环境安全配置

```env
# 生产环境必须修改
JWT_SECRET=your-strong-secret-key-change-this
JWT_EXPIRES_IN=24h

# 数据库连接
MONGODB_URI=mongodb://username:password@host:port/database?authSource=admin

# 限流配置
RATE_LIMIT_WINDOW_MS=900000  # 15分钟
RATE_LIMIT_MAX_REQUESTS=100   # 每个IP最多100请求
```

## 🧪 测试与验证

### 功能验证脚本

```bash
# 运行数据权限功能验证
npx tsx src/scripts/verifyDataScope.ts

# 输出示例：
✅ 部门服务测试通过
✅ 数据权限计算测试通过
✅ 中间件查询条件构建测试通过
✅ 部门树形结构测试通过
✅ 整体流程测试通过
```

### 数据库初始化

```bash
# 初始化数据库（创建管理员用户）
npm run init-db

# 默认管理员账号：
# 用户名: superadmin
# 密码: SuperAdmin_123
# 角色: super_admin（拥有所有权限）
```

## 📚 开发规范

### 代码风格

- 使用 **ESLint** 进行代码质量检查
- 使用 **Prettier** 自动格式化代码
- 遵循 **TypeScript** 严格类型检查
- 目录结构遵循 **模块化** 设计原则

## 📄 许可证

本项目采用 **ISC 许可证** - 详见 [LICENSE](LICENSE) 文件。

---
