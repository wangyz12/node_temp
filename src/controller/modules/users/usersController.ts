function query(req: ExpressRequest, res: ExpressResponse, next: ExpressNext) {
  res.send('查询');
}

export default {
  query,
};
