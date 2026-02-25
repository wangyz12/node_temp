import express from 'express';
import controller from './../../../controller/index.ts';
const router = express.Router();
/* GET users listing. */
router.post('/query', controller.usersController.query);

export default router;
