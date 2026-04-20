# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./

RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/package-lock.json ./

RUN npm ci --omit=dev

RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# 不修改环境变量，让用户通过 docker-compose 传入
# 只复制示例文件，不修改
COPY .env.example .env.production

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

CMD ["node", "dist/server.js"]