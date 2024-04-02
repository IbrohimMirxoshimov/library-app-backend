const { Router } = require("express");
const Model = require("../../database/models/Comment");
const middlewares = require("../middlewares");
const route = Router();

module.exports = (app) => {
	app.use("/comments", middlewares.isAuth, route);

	route.get("/", middlewares.getList(Model));
	route.get("/:id", middlewares.getOne(Model));
	route.post("/", middlewares.add(Model));
	route.put("/:id", middlewares.edit(Model));
	route.delete("/:id", middlewares.destroy(Model));
};
