const { Router } = require("express");
const UserController = require("../../controllers/user");
const User = require("../../database/models/User");
const middlewares = require("../middlewares");
const { isOwner, isLibrarian } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/users", middlewares.isAuth, isLibrarian, route);

	route.get("/", UserController.getList());
	route.get("/:id", UserController.getOne());
	route.post("/", UserController.add());
	route.put("/:id", UserController.update());
	route.delete("/:id", isOwner, middlewares.destroy(User));
};
