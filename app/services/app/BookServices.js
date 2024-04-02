const {
	Book,
	Stock,
	Author,
	Rent,
	Collection,
} = require("../../database/models");
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
	attributes: ["id", "name", "image", "description", "updatedAt"],
};

module.exports = {
	getOne(id) {
		return Book.findByPk(id, {
			attributes: BookOptions.attributes,
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
					options: {
						distinct: true,
						attributes: BookOptions.attributes,
						include: [
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
							},
						],
					},
				},
				Book
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
