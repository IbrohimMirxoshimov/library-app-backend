const { Router } = require("express");
const BooksGroup = require("../../database/models/BooksGroup");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/booksgroups", middlewares.isAuth, isModerator, route);

	route.get("/", middlewares.getList(BooksGroup));
	route.get("/:id", middlewares.getOne(BooksGroup));
	route.post("/", middlewares.add(BooksGroup));
	route.put("/:id", middlewares.edit(BooksGroup));
	route.delete("/:id", middlewares.destroy(BooksGroup));
};
