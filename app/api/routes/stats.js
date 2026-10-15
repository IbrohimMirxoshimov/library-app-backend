const { Router } = require("express");
const { Joi, celebrate } = require("celebrate");
const middlewares = require("../middlewares");
const { isLibrarian } = require("../middlewares/permissions");
const StatServices = require("../../services/StatServices");
const HttpError = require("../../utils/HttpError");
const route = Router();

const DAY_MS = 24 * 60 * 60 * 1000;
const isoDay = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

// "YYYY-MM-DD" is a day in Tashkent (UTC+5, no DST)
function tashkentDayStart(day) {
	return new Date(`${day}T00:00:00+05:00`);
}

module.exports = (app) => {
	app.use("/stats", middlewares.isAuth, isLibrarian, route);

	route.get("/", async (req, res) => {
		res.status(200).json(await StatServices.getStats(req.user.locationId));
	});

	route.get("/summary", async (req, res, next) => {
		try {
			res.status(200).json(await StatServices.getSnapshot(req.user.locationId));
		} catch (e) {
			next(e);
		}
	});

	route.get(
		"/range",
		celebrate({
			query: Joi.object({
				from: isoDay.required(),
				to: isoDay.required(),
			}),
		}),
		async (req, res, next) => {
			try {
				const from = tashkentDayStart(req.query.from);
				const to = new Date(tashkentDayStart(req.query.to).getTime() + DAY_MS);

				if (isNaN(from) || isNaN(to) || from >= to) {
					throw HttpError(400, "Noto'g'ri sana oralig'i");
				}

				res.status(200).json(
					await StatServices.getRangeStats({
						locationId: req.user.locationId,
						from,
						to,
					})
				);
			} catch (e) {
				next(e);
			}
		}
	);
};
