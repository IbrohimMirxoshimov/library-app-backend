const { Router } = require("express");
const Publishing = require("../../database/models/Publishing");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/publishings", middlewares.isAuth, isModerator, route);

	route.get("/", middlewares.getList(Publishing));
	route.get("/:id", middlewares.getOne(Publishing));
	route.post("/", middlewares.add(Publishing));
	route.put("/:id", middlewares.edit(Publishing));
	route.delete("/:id", middlewares.destroy(Publishing));
};
