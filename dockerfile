# ==================== 构建阶段 ====================
# 使用多阶段构建，减小最终镜像体积
# 第一阶段：编译 TypeScript 代码
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖配置文件
# package*.json 匹配 package.json 和 package-lock.json
COPY package*.json ./
COPY package-lock.json ./

# 安装依赖
# npm ci 比 npm install 更快、更严格，适合 CI/CD 环境
# 会根据 package-lock.json 精确安装，确保版本一致性
RUN npm ci

# 复制所有源代码
# 此时 .dockerignore 会排除 node_modules、dist 等不需要的文件
COPY . .

# 构建 TypeScript 项目
# 执行 package.json 中的 build 命令，生成 dist 目录
RUN npm run build

# ==================== 生产阶段 ====================
# 第二阶段：只复制构建产物，不包含源码和开发依赖
# 重新从纯净的 Alpine 镜像开始，大幅减小最终镜像体积
FROM node:20-alpine

WORKDIR /app

# 创建非 root 用户（安全最佳实践）
# 容器内的应用不应该以 root 用户运行
# -g 1001 -S: 创建系统组，GID 为 1001
# -S -u 1001: 创建系统用户，UID 为 1001
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# 从构建阶段复制构建产物
# --from=builder: 从上一阶段复制文件
# --chown=nodejs:nodejs: 将文件所有者改为刚创建的非 root 用户
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json ./

# 只安装生产依赖
# --omit=dev: 跳过 devDependencies，减小镜像体积
RUN npm ci --omit=dev

# 创建日志目录并设置权限
# 应用需要写入日志，目录必须属于 nodejs 用户
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# 复制环境变量示例文件（运行时会被 docker-compose 的 env_file 覆盖）
# 作为默认配置，方便用户快速测试
COPY .env.example .env.production

# 切换到非 root 用户（安全最佳实践）
# 后续所有命令都以 nodejs 用户身份运行
USER nodejs

# 声明容器监听的端口（仅作文档说明，实际映射由 docker-compose 控制）
EXPOSE 3000

# 健康检查
# 定期检查应用是否正常运行
# interval=30s: 每30秒检查一次
# timeout=3s: 检查超时时间
# start-period=10s: 启动后等待10秒才开始检查
# retries=3: 连续失败3次标记为不健康
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# 启动命令
# 运行编译后的服务端文件
CMD ["node", "dist/server.js"]