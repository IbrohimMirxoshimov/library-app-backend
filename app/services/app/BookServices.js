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
	getOne(id) {
		return Book.findByPk(id, {
			attributes: BookOptions.attributes,
			paranoid: false,
			include: [
				{
					model: Stock,
					as: "stocks",
					attributes: ["id", "busy", "locationId"],
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
	getList(query) {
		return Book.findAndCountAll(
			getListOptions(
				query,
				{
					search: ({ q }) => {
						return Sequelize.where(
							Sequelize.fn(
								"concat",
								Sequelize.col("books.name"),
								Sequelize.col("author.name")
							),
							{
								[Op.iLike]: `%${q}%`,
							}
						);
					},
					options: {
						distinct: true,
						attributes: BookOptions.attributes,
						logging: true,
					},
				},
				Book,
				() => [
					{
						model: Stock,
						as: "stocks",
						attributes: ["id", "busy", "locationId"],
						where: getObjectAvailable({
							locationId: query.locationId || 1,
							busy: query.busy,
						}),
					},
					{
						model: Author,
						as: "author",
						attributes: ["name"],
						where: {
							name: {
								[Op.not]: null,
							},
						},
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
			limit: 30,
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
