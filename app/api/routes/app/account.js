const { Router } = require("express");
const User = require("../../../database/models/User");
const AccountServices = require("../../../services/app/AccountServices");
const isAuth = require("../../middlewares/isAuth");
const { listResponse } = require("../../middlewares/utils");

module.exports = (app) => {
	const route = Router();

	route
		.get("/", async (req, res, next) => {
			try {
				let user = (await User.findByPk(req.user.id)).toJSON();

				delete user.owner;
				delete user.phone;
				delete user.librarian;
				delete user.moderator;
				delete user.username;
				delete user.libraryId;
				delete user.password;
				delete user.tempLocationId;
				delete user.regionId;

				res.json(user).status(200);
			} catch (e) {
				next(e);
			}
		})
		.patch("/", async (req, res, next) => {
			try {
				delete req.body.owner;
				delete req.body.phone;
				delete req.body.librarian;
				delete req.body.moderator;
				delete req.body.username;
				delete req.body.libraryId;
				delete req.body.locationId;

				let result = await User.update(req.body, {
					where: { id: req.user.id },
				});

				if (!result[0]) return res.json({ message: "Not found" }).status(404);

				return res.json({ message: "Updated" }).status(200);
			} catch (e) {
				next(e);
			}
		})
		.get("/books", async (req, res, next) => {
			try {
				let { count, rows } = await AccountServices.getUserBooks(
					req.user.id,
					req.query.returned === "1"
				);

				return listResponse(res, req.query.page, rows, count);
			} catch (e) {
				next(e);
			}
		});

	app.use("/account", isAuth, route);
};
