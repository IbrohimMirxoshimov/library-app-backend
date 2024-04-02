const { Op } = require("sequelize");
const { Rent, Stock, User, Book, Comment } = require("../database/models");
const { getOneDayBackDate } = require("../utils/date");

const RentServices = {
	report: (locationId = 1, filter = {}) => {
		let bookOptions = {};

		if (filter.bookId) {
			bookOptions.where = {
				id: filter.bookId,
			};
		}

		let userOptions = {};
		if (filter.gender) {
			userOptions.where = {
				gender: filter.gender,
			};
		}

		let options = {
			include: [
				{
					model: Stock,
					as: "stock",
					where: {
						locationId: locationId,
					},
					paranoid: false,
					include: {
						model: Book,
						as: "book",
						attributes: ["id", "name"],
						paranoid: false,
						...bookOptions,
					},
				},
				{
					model: User,
					as: "user",
					attributes: ["id", "firstName", "lastName", "phone", "extraPhone"],
					paranoid: false,
					...userOptions,
				},
				{
					model: Comment,
					attributes: ["id", "text", "createdAt"],
				},
			],
			where: {
				returnedAt: {
					[Op.is]: null,
				},
				rejected: {
					[Op.not]: true,
				},
				returningDate: { [Op.lt]: getOneDayBackDate(new Date(), 3) },
			},
			order: [["returningDate", "ASC"]],
		};

		return Rent.findAndCountAll(options);
	},
};

module.exports = RentServices;
