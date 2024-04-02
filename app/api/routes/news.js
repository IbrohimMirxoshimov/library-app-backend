const { Router } = require("express");
const News = require("../../database/models/News");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/news", middlewares.isAuth, isModerator, route);

	route.get("/", middlewares.getList(News));
	route.get("/:id", middlewares.getOne(News));
	route.post("/", middlewares.add(News));
	route.put("/:id", middlewares.edit(News));
	route.delete("/:id", middlewares.destroy(News));
};
