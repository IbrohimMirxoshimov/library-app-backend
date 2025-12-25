const {
	Book,
	Stock,
	Author,
	Rent,
	Collection,
} = require("../../database/models");
const { Sequelize, Op } = require("sequelize");
const { getListOptions } = require("../../api/middlewares/utils");

function getObjectAvailable(object) {
	for (const key in object) {
		if (!object[key]) {
			delete object[key];
		}
	}

	return object;
}

const BookOptions = {
	attributes: [
		"id",
		"name",
		"image",
		"description",
		"updatedAt",
		"deletedAt",
	],
};

module.exports = {
	getOne(id, locationId) {
		return Book.findByPk(id, {
			attributes: BookOptions.attributes,
			paranoid: false,
			include: [
				{
					model: Stock,
					as: "stocks",
					attributes: ["id", "busy", "locationId"],
					where: {
						locationId: locationId || 1,
					},
				},
				{
					model: Author,
					as: "author",
					attributes: ["name"],
				},
				{
					model: Collection,
					as: "collection",
					attributes: ["name"],
				},
			],
		});
	},
	getList(query, locationId) {
		return Book.findAndCountAll(
			getListOptions(
				query,
				{
					search: ({ q }) => {
						// Lowercase search for better index usage
						const searchTerm = q.toLowerCase();
						return {
							[Op.or]: [
								Sequelize.where(
									Sequelize.fn("LOWER", Sequelize.col("books.name")),
									{ [Op.like]: `%${searchTerm}%` }
								),
								Sequelize.where(
									Sequelize.fn("LOWER", Sequelize.col("author.name")),
									{ [Op.like]: `%${searchTerm}%` }
								),
							],
						};
					},
					options: {
						// Use subQuery to optimize distinct count
						subQuery: false,
						distinct: true,
						attributes: BookOptions.attributes,
					},
				},
				Book,
				() => [
					{
						model: Stock,
						as: "stocks",
						attributes: ["id", "busy", "locationId"],
						where: getObjectAvailable({
							locationId: locationId || 1,
							busy: query.busy,
						}),
						required: true, // INNER JOIN - faster than LEFT JOIN
					},
					{
						model: Author,
						as: "author",
						attributes: ["name"],
						required: true, // INNER JOIN
					},
				]
			)
		);
	},
	getBookStatuses(bookId, locationId) {
		return Rent.findAll({
			attributes: ["id", "returningDate"],
			where: {
				returnedAt: null,
				rejected: false,
				deletedAt: null,
			},
			limit: 100,
			include: [
				{
					model: Stock,
					as: "stock",
					attributes: ["locationId", "bookId"],
					where: getObjectAvailable({
						locationId: locationId || 1,
						bookId: bookId,
					}),
				},
			],
		});
	},
};
