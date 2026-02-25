// src/types/global/helper.ts
// 这个文件辅助生成全局类型

// 定义一个工具类型，用于将模块的所有导出转换为全局类型
export type RegisterGlobal<T> = {
  [K in keyof T]: T[K];
};

// 定义需要注册的模块
export interface GlobalModules {
  express: typeof import('./express.ts');
  // 后续可以添加其他模块
  // user: typeof import('./user');
}

// 辅助类型：将所有模块的类型合并
export type AllGlobalTypes = {
  [M in keyof GlobalModules]: {
    [K in keyof GlobalModules[M]]: GlobalModules[M][K];
  };
}[keyof GlobalModules];

// 展开所有类型
export type ExpandedGlobalTypes = {
  [K in keyof AllGlobalTypes]: AllGlobalTypes[K];
};
