const { Joi, celebrate } = require("celebrate");
const StatServices = require("../../../services/StatServices");

module.exports = (app) => {
	app.post(
		"/stats/by-range",
		celebrate({
			body: Joi.object({
				untill: Joi.date().iso().required(),
				from: Joi.date().iso().required(),
			}),
		}),
		async (req, res) => {
			res.status(200).json(await StatServices.getStatByRange(req.body));
		}
	);
	app.get("/stats", async (req, res) => {
		const libraryId = req.headers["library"]
			? Number(req.headers["library"])
			: 1;

		res.status(200).json(await StatServices.getStats(libraryId));
	});
};
