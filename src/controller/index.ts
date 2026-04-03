import captchaController from './modules/captcha/captcha.ts';
import deptController from './modules/dept/deptController.ts';
import menuController from './modules/menu/menuController.ts';
import roleController from './modules/role/roleController.ts';
import testController from './modules/test/testController.ts';
import userRoleController from './modules/userRole/userRoleController.ts';
import userController from './modules/users/userController.ts';
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
