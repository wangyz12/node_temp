// eslint.config.mjs
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
export default tseslint.config(
  // 1. 全局忽略配置
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.js',
      '*.mjs',
      '*.cjs'
    ]
  },

  // 2. 基础 ESLint 推荐规则
  eslint.configs.recommended,

  // 3. TypeScript 推荐规则
  ...tseslint.configs.recommended,

  // 4. 针对 TypeScript 文件的严格模式（可选，但推荐）
  ...tseslint.configs.strict,

  // 5. 你的项目自定义配置
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node, // Node.js 全局变量
      },
      parserOptions: {
        project: './tsconfig.json', // 启用类型检查规则需要
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // ===== 基础规则 =====
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      
      // ===== TypeScript 特定规则 =====
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', // 允许以 _ 开头的参数未使用
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn', // 避免使用 any
      '@typescript-eslint/explicit-function-return-type': 'off', // Express 路由中可省略返回类型
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // ===== 导入排序规则 =====
      'simple-import-sort/imports': ['error', {
        groups: [
          // 1. 外部模块 (node_modules)
          ['^@?\\w'],
          // 2. 内部模块 (src 内部)
          ['^(@/|src/)(?!.*\\.css$)'],
          // 3. 父级目录
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // 4. 同级目录
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // 5. 样式文件
          ['^.+\\.css$']
        ]
      }],
      'simple-import-sort/exports': 'error',
      
      // ===== 导入规则 =====
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      
      // ===== Express 项目特有规则 =====
      'no-return-await': 'off', // 允许 return await（Express 错误处理中常用）
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    }
  },

  // 6. 针对测试文件的特殊配置（如果有）
  {
    files: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // 测试中允许 any
    }
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      ...prettierConfig.rules,
    }
  }
);