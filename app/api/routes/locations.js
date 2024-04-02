const { Router } = require("express");
const Location = require("../../database/models/Location");
const middlewares = require("../middlewares");
const { isOwner, isLibrarian } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/locations", middlewares.isAuth, route);

	route.get("/", isLibrarian, middlewares.getList(Location));
	route.get("/:id", isOwner, middlewares.getOne(Location));
	route.post("/", isOwner, middlewares.add(Location));
	route.put("/:id", isOwner, middlewares.edit(Location));
	route.delete("/:id", isOwner, middlewares.destroy(Location));
};
