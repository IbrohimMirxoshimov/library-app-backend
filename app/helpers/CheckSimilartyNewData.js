const { Op } = require("sequelize");

async function CheckSimilartyNewData(model, body, attribute = "name") {
	const similarByName = await model.findOne({
		where: {
			[attribute]: { [Op.iLike]: `%${body[attribute].toLowerCase()}%` },
		},
		attributes: ["id"],
	});

	if (similarByName) {
		throw new BadRequestExaption("Bu nom mavjud, iltmos avval qidiring!");
	}
}

exports.CheckSimilartyNewData = CheckSimilartyNewData;

exports.BadRequestExaption = class BadRequestExaption extends Error {
	constructor(name = "Bad request") {
		super();
		this.message = name;
		this.name = name;
	}

	status = 400;
};
