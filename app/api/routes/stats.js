const { Router } = require("express");
const middlewares = require("../middlewares");
const { isLibrarian } = require("../middlewares/permissions");
const StatServices = require("../../services/StatServices");
const route = Router();

module.exports = (app) => {
	app.use("/stats", middlewares.isAuth, isLibrarian, route);

	route.get("/", async (req, res) => {
		res.status(200).json(await StatServices.getStats(req.user.locationId));
	});
};
