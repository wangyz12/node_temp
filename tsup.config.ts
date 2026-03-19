import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: 'esm',
  target: 'node18',
  splitting: false,
  sourcemap: false,
  clean: true,
  minify: false,
  bundle: true,
  external: [
    // 外部依赖，不打包
    'mongoose',
    'express',
    'jsonwebtoken',
    'bcrypt',
    'cors',
    'helmet',
    'dotenv',
    'morgan',
    'cookie-parser',
    'express-rate-limit',
    'express-mongo-sanitize',
    'express-validator',
    'svg-captcha',
    'uuid',
    'xss',
    'chalk'
  ],
  loader: {
    '.ts': 'ts'
  },
  tsconfig: 'tsconfig.json',
  onSuccess: 'echo "Build completed successfully"',
  // 禁用类型检查
  dts: false,
  skipNodeModulesBundle: true
})