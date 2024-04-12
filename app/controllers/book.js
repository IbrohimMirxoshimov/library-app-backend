const { Book } = require("../database/models");
const Stock = require("../database/models/Stock");
const { CheckSimilartyNewData } = require("../helpers/CheckSimilartyNewData");
const { BadRequestExaption } = require("../helpers/HttpExaptions");

const BookController = {
	add: () => async (req, res, next) => {
		try {
			await CheckSimilartyNewData(Book, req.body);
			const result = await Book.create({
				...req.body,
				creatorId: req.user.id,
			});

			return res.json(result.toJSON()).status(201);
		} catch (e) {
			next(e);
		}
	},
	destroy: () => async (req, res, next) => {
		try {
			const stocks = await Stock.findOne({ where: { bookId: req.params.id } });

			if (stocks) {
				throw new BadRequestExaption(
					"Kitoblarga ulangan. Iltimos avval 'Kitoblarim' bo'limidan ulangan kitobni o'chiring yoki boshqa kitobga ulang!"
				);
			}

			const result = await Book.destroy({ where: { id: req.params.id } });

			if (!result[0]) return res.json({ message: "Not found" }).status(404);

			return res.json({ message: "Destroyed" }).status(200);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = BookController;
