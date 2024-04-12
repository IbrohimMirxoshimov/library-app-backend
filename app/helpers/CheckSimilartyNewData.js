const { BadRequestExaption } = require("./HttpExaptions");
const { Op } = require("sequelize");

exports.CheckSimilartyNewData = async function CheckSimilartyNewData(
	model,
	body,
	attribute = "name"
) {
	const similarByName = await model.findOne({
		where: {
			[attribute]: { [Op.iLike]: `%${body[attribute].toLowerCase()}%` },
		},
		attributes: ["id"],
	});

	if (similarByName) {
		throw new BadRequestExaption("Bu nom mavjud, iltmos avval qidiring!");
	}
};
