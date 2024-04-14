const { rateLimit } = require("express-rate-limit");
const RentServices = require("../../../services/RentServices");
const { JoiSchemes } = require("../../../helpers/validators");
const { celebrate, Joi } = require("celebrate");
const HttpError = require("../../../utils/HttpError");

function ExpiredRentByPhone(app) {
	const limiter = rateLimit({
		windowMs: 60 * 60 * 1000,
		limit: 5,
		standardHeaders: "draft-7",
	});

	app.post(
		"/expired-rent-info",
		celebrate({
			body: Joi.object({
				phone: JoiSchemes.phoneNine.required(),
			}),
		}),
		// limiter,
		async (req, res, next) => {
			try {
				const phone = req.body.phone;

				const rents = await RentServices.report(1, {
					userWhereOptions: {
						phone,
					},
				});

				if (rents.rows.length === 0) {
					throw HttpError(404);
				}

				res.json(rents.rows).status(200);
			} catch (e) {
				next(e);
			}
		}
	);
}

module.exports = ExpiredRentByPhone;
