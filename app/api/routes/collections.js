const { Router } = require("express");
const Collection = require("../../database/models/Collection");
const middlewares = require("../middlewares");
const { isModerator } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/collections", middlewares.isAuth, isModerator, route);

	route.get("/", middlewares.getList(Collection));
	route.get("/:id", middlewares.getOne(Collection));
	route.post("/", middlewares.add(Collection));
	route.put("/:id", middlewares.edit(Collection));
	route.delete("/:id", middlewares.destroy(Collection));
};
