const { CheckSimilartyNewData } = require("../../helpers/CheckSimilartyNewData");

const add = (Model) => async (req, res, next) => {
	try {
		if (Model.rawAttributes["name"]) {
			await CheckSimilartyNewData(Model, req.body);
		}

		const result = await Model.create(req.body);

		return res.json(result.toJSON()).status(201);
	} catch (e) {
		next(e);
	}
};

module.exports = add;
