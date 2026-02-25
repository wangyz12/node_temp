// src/routes/index.ts
import express, { Router } from 'express';

import usersRouter from './modules/test/test.ts';

const router: Router = express.Router();

router.use('/test', usersRouter);

export default router;
