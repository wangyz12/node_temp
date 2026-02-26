import testController from './modules/test/testController.ts';
import userController from './modules/users/userController.ts';
// 统一导出
const controller = {
  testController,
  userController,
};

export default controller;
