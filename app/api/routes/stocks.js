const { Router } = require("express");
const StockController = require("../../controllers/stock");
const Stock = require("../../database/models/Stock");
const middlewares = require("../middlewares");
const { isLibrarian, isOwner } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/stocks", middlewares.isAuth, isLibrarian, route);

	route.get("/", StockController.getList());
	route.get("/:id", middlewares.getOne(Stock));
	route.post("/", StockController.add());
	route.put("/:id", isOwner, StockController.update());
	route.delete("/:id", middlewares.destroy(Stock));
};
