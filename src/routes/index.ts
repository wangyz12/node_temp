// src/routes/index.ts
import express, { Router } from 'express';

import usersRouter from './modules/users/users.ts';

const router: Router = express.Router();

router.use('/users', usersRouter);

export default router;
