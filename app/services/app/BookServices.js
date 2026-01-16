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
	async getList(query, locationId) {
		const stockWhere = getObjectAvailable({
			locationId: locationId || 1,
			busy: query.busy,
		});

		const result = await Book.findAndCountAll(
			getListOptions(
				query,
				{
					search: ({ q }) => {
						// Lowercase search for better index usage
						const searchTerm = q.toLowerCase();
						return {
							[Op.or]: [
								Sequelize.where(
									Sequelize.fn(
										"LOWER",
										Sequelize.col("books.name")
									),
									{ [Op.like]: `%${searchTerm}%` }
								),
								Sequelize.where(
									Sequelize.fn(
										"LOWER",
										Sequelize.col("author.name")
									),
									{ [Op.like]: `%${searchTerm}%` }
								),
							],
						};
					},
					options: {
						// Use subQuery for proper pagination
						subQuery: false,
						attributes: BookOptions.attributes,
						// Main filtering: only books that have stocks matching criteria
						where: Sequelize.literal(`EXISTS (
							SELECT 1 FROM stocks 
							WHERE stocks."bookId" = books.id 
							AND stocks."locationId" = ${stockWhere.locationId}
							${stockWhere.busy !== undefined ? `AND stocks.busy = ${stockWhere.busy}` : ""}
						)`),
					},
				},
				Book,
				() => [
					{
						model: Stock,
						as: "stocks",
						attributes: ["id", "busy", "locationId"],
						where: stockWhere,
						separate: true, // Load in separate query after filtering
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

		return result;
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
