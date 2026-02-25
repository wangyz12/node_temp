// 第一种参数直接赋类型
function query(req: ExpressRequest, res: ExpressResponse, next: ExpressNext) {
  res.send('查询');
}
// 第二种剪头函数式声明类型
const createUser: AsyncController = async (req, res) => {
  // 业务逻辑
  res.json({ success: true });
};
export default {
  query,
};
