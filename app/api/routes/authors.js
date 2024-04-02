const { Router } = require("express");
const Author = require("../../database/models/Author");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const AuthorController = require("../../controllers/author");
const route = Router();

module.exports = (app) => {
	app.use("/authors", middlewares.isAuth, isModerator, route);

	route.get("/", middlewares.getList(Author));
	route.get("/:id", middlewares.getOne(Author));
	route.post("/", AuthorController.add());
	route.put("/:id", middlewares.edit(Author));
	route.delete("/:id", middlewares.destroy(Author));
};
