const { Router } = require("express");
const Region = require("../../database/models/Region");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/regions", middlewares.isAuth, route);

	route.get("/", middlewares.getList(Region));
	route.get("/:id", middlewares.getOne(Region));
	route.post("/", isModerator, middlewares.add(Region));
	route.put("/:id", isModerator, middlewares.edit(Region));
	route.delete("/:id", isModerator, middlewares.destroy(Region));
};
