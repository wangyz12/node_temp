import captchaController from './modules/system/captcha/captcha.ts';
import deptController from './modules/system/dept/deptController.ts';
import menuController from './modules/system/menu/menuController.ts';
import roleController from './modules/system/role/roleController.ts';
import testController from './modules/test/testController.ts';
import userRoleController from './modules/system/userRole/userRoleController.ts';
import userController from './modules/system/users/userController.ts';
// 统一导出
const controller = {
  captchaController,
  testController,
  userController,
  menuController,
  roleController,
  deptController,
  userRoleController,
};

export default controller;
