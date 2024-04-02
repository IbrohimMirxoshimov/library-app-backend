const { Stock, Rent, Book } = require("../../database/models");
const { getListOptions } = require("../../api/middlewares/utils");
const { Op } = require("sequelize");

module.exports = {
	getUserBooks(userId, returned) {
		return Rent.findAndCountAll(
			getListOptions(
				{
					filters: { userId: userId },
					sort: "returningDate",
					size: 10,
				},
				{
					options: {
						include: {
							model: Stock,
							as: "stock",
							attributes: ["id", "bookId"],
							include: {
								model: Book,
								as: "book",
								paranoid: false,
								attributes: ["id", "name", "image"],
							},
							paranoid: false,
						},
					},
				},
				Rent,
				null,
				{
					returnedAt: returned
						? {
								[Op.not]: null,
						  }
						: {
								[Op.is]: null,
						  },
					deletedAt: null,
				}
			)
		);
	},
};
