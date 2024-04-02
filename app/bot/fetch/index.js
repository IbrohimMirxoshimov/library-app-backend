const { Op } = require("sequelize");
const { Book, Stock, Author } = require("../../database/models");

async function getBooksWithStocks({
	name,
	size = 15,
	page = 1,
	locationId = 1,
}) {
	let options = {
		attributes: ["id", "name", "image"],
		include: [
			{
				model: Stock,
				as: "stocks",
				attributes: ["id", "busy", "locationId"],
				where: {
					locationId: locationId,
				},
			},
			{
				model: Author,
				as: "author",
				attributes: ["name"],
			},
		],
		order: [["name", "ASC"]],
		offset: (page - 1) * size,
		limit: size,
	};

	let where = [];

	if (name) {
		where.push({ name: { [Op.iLike]: `%${name}%` } });
	}

	if (where.length) {
		options.where = where;
	}

	return await Book.findAll(options);
}

async function getBook(bookId, locationId) {
	return (
		await Book.findByPk(bookId, {
			include: {
				model: Stock,
				as: "stocks",
				attributes: ["id", "busy", "locationId"],
				where: {
					locationId: locationId,
				},
			},
		})
	)?.toJSON();
}

module.exports = {
	getBooksWithStocks: getBooksWithStocks,
	getBook: getBook,
};
