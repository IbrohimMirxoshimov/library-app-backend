const { getListOptions } = require("./utils");

const getList = (Model) => async (req, res, next) => {
	try {
		const { count, rows } = await Model.findAndCountAll(
			getListOptions(req.query, null, Model)
		);
		return res
			.json({
				page: parseInt(req.query.page) || 1,
				items: rows,
				totalCount: count,
			})
			.status(200);
	} catch (e) {
		next(e);
	}
};

module.exports = getList;
