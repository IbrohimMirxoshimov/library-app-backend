const { Router } = require("express");
const { Town } = require("../../database/models");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");

module.exports = (app) => {
	const route = Router();
	app.use("/towns", middlewares.isAuth, route);

	route.get("/", middlewares.getList(Town));
	route.get("/:id", middlewares.getOne(Town));
	route.post("/", isModerator, middlewares.add(Town));
	route.put("/:id", isModerator, middlewares.edit(Town));
	route.delete("/:id", isModerator, middlewares.destroy(Town));
};
