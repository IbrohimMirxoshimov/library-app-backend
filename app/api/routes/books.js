const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const Book = require("../../database/models/Book");
const middlewares = require("../middlewares");
const { isModerator, isOwner } = require("../middlewares/permissions");
const BookController = require("../../controllers/book");
const route = Router();
function isValidHttpUrl(string) {
	let url;
	try {
		url = new URL(string);
	} catch (_) {
		return false;
	}
	return url.protocol === "http:" || url.protocol === "https:";
}
const isImagePattern = /.*\.(png|jpg)$/;

module.exports = (app) => {
	app.use("/books", middlewares.isAuth, route);

	route.get("/", middlewares.getList(Book));
	route.get("/:id", middlewares.getOne(Book));
	route.post(
		"/",
		isModerator,
		celebrate({
			body: Joi.object({
				name: Joi.string().required(),
				image: Joi.string()
					.optional()
					.allow(null)
					.uri()
					.regex(isImagePattern)
					.message(
						"Rasm formati to'g'ri emas. Qabul qilinadi: jpg, jpeg, png"
					),
			}).options({
				allowUnknown: true,
			}),
		}),
		BookController.add()
	);
	route.put(
		"/:id",
		isModerator,
		celebrate({
			body: Joi.object({
				name: Joi.string().required(),
				image: Joi.string()
					.optional()
					.allow(null)
					.uri()
					.regex(isImagePattern)
					.message(
						"Rasm formati to'g'ri emas. Qabul qilinadi: jpg, jpeg, png"
					),
			}).options({
				allowUnknown: true,
			}),
		}),
		middlewares.edit(Book)
	);
	route.delete("/:id", isOwner, BookController.destroy());
};
