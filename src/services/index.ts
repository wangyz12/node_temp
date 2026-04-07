// src/services/index.ts
// 服务层统一导出文件

// 系统服务
export { UserService } from './system/user.service.ts';
export { RoleService } from './system/role.service.ts';
export { MenuService } from './system/menu.service.ts';
export { UserRoleService } from './system/userRole.service.ts';
export { DeptService } from './system/dept.service.ts';

// 服务实例（单例模式）
import deptService from './system/dept.service.ts';
export { deptService };
