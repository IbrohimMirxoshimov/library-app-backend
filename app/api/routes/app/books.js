const { Joi, celebrate } = require("celebrate");
const { Router } = require("express");
const { Collection, Author } = require("../../../database/models");
const BookServices = require("../../../services/app/BookServices");
const { listResponse } = require("../../middlewares/utils");
const HttpError = require("../../../utils/HttpError");
module.exports = (app) => {
	const route = Router();

	route
		.get("/", async (req, res, next) => {
			try {
				const { count, rows } = await BookServices.getList(req.query);

				return listResponse(res, req.query.page, rows, count);
			} catch (e) {
				next(e);
			}
		})
		.get("/filter-data", async (req, res, next) => {
			try {
				const collections = await Collection.findAll({
					raw: true,
					attributes: ["id", "name"],
				});
				const authors = await Author.findAll({
					raw: true,
					attributes: ["id", "name"],
				});

				return res
					.json({
						collections: collections,
						authors: authors,
					})
					.status(200);
			} catch (e) {
				next(e);
			}
		})
		.get("/:id", async (req, res, next) => {
			try {
				let result = await BookServices.getOne(req.params.id);

				if (!result) throw HttpError(404);

				return res.json(result.toJSON()).status(200);
			} catch (e) {
				next(e);
			}
		})
		.get(
			"/:id/statuses",
			celebrate({
				query: Joi.object({
					locationId: Joi.number().required(),
				}),
			}),

			async (req, res, next) => {
				try {
					let result = await BookServices.getBookStatuses(
						req.params.id,
						req.query.locationId
					);

					if (!result) throw HttpError(404);

					return res.json(result).status(200);
				} catch (e) {
					next(e);
				}
			}
		);

	app.use("/books", route);
};
