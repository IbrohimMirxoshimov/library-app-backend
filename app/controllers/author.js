const { Author } = require("../database/models");
const { CheckSimilartyNewData } = require("../helpers/CheckSimilartyNewData");

const AuthorController = {
	add: () => async (req, res, next) => {
		try {
			await CheckSimilartyNewData(Author, req.body);

			const result = await Author.create({
				...req.body,
				creatorId: req.user.id,
			});

			return res.json(result.toJSON()).status(201);
		} catch (e) {
			next(e);
		}
	},
};

module.exports = AuthorController;
