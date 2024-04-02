const StatServices = require("../../../services/StatServices");

module.exports = (app) => {
	app.get("/stats", async (req, res) => {
		res.status(200).json(await StatServices.getStats());
	});
};
