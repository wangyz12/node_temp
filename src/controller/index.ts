import testController from './modules/test/testController.ts';
import userController from './modules/users/userController.ts';
import menuController from './modules/menu/menuController.ts';
// 统一导出
const controller = {
  testController,
  userController,
  menuController,
};

export default controller;
