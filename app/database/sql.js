const { Op } = require("sequelize");
const { ONE_DAY_IN_MS } = require("../constants/mix");
const { groupBy } = require("../utils/array");
const { Rent, Stock, Book } = require("./models");

async function dbQuery() {
	const rents = await Rent.findAll({
		attributes: ["leasedAt", "returningDate", "stockId"],
		where: {
			deletedAt: null,
			returnedAt: {
				[Op.not]: null,
			},
			stockId: {
				[Op.not]: null,
			},
			rejected: false,
			rejected: false,
		},
		include: {
			as: "stock",
			model: Stock,
			attributes: ["bookId"],
			paranoid: false,
		},
	});

	const data_days = rents.map((rent) => {
		let days = Math.floor((rent.returningDate - rent.leasedAt) / ONE_DAY_IN_MS);
		return {
			days: days,
			bookId: rent.stock.bookId,
		};
	});

	function getAvarage(list, valueGetter) {
		return list.reduce((pv, cv) => valueGetter(cv) + pv, 0) / list.length;
	}

	const avg_durations_of_book = Array.from(
		groupBy(data_days, (data) => data.bookId)
	).map(([bookId, groupsByBookId]) => ({
		rentDuration: Math.floor(getAvarage(groupsByBookId, (item) => item.days)),
		id: groupsByBookId[0].bookId,
	}));

	await updateBooksBefore();
	await updateBooks(avg_durations_of_book);

	console.log("Done");
}

async function updateBooks(books) {
	for (const book of books) {
		await Book.update(book, { where: { id: book.id } });
	}

	console.log(books.length + " books updated");
}

async function updateBooksBefore() {
	let r = await Book.update(
		{
			rentDuration: 15,
		},
		{
			where: {
				rentDuration: {
					[Op.lt]: 15,
				},
			},
		}
	);

	console.log(r[0] + " books set 15 day duration");
}

module.exports = dbQuery;
