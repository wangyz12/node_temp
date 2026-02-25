import express from 'express';
import controller from './../../../controller/index.ts';
import vaiedation from './../../../vaiedation/index.ts';
const router = express.Router();
/* GET users listing. */
router.post(
  '/query',
  vaiedation.usersvViedation.validateCreateUser,
  controller.usersController.query
);

export default router;
