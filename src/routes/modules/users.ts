import express from 'express';

const router = express.Router();
/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('查询');
});

export default router;
