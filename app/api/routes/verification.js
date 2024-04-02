const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const { JoiSchemes } = require("../../helpers/validators");
const Verification = require("../../services/Verification");
const HttpError = require("../../utils/HttpError");
const middlewares = require("../middlewares");
const { isLibrarian } = require("../middlewares/permissions");
const route = Router();

module.exports = (app) => {
	app.use("/verification", middlewares.isAuth, isLibrarian, route);

	route.post(
		"/send-code",
		celebrate({
			body: Joi.object({
				phone: JoiSchemes.phoneNine.required(),
			}),
		}),
		async (req, res, next) => {
			try {
				await Verification.sendCode("998" + req.body.phone, req.user.id);
				return res.json({ message: "Success" }).status(200);
			} catch (e) {
				next(e);
			}
		}
	);
	route.post(
		"/verify",
		celebrate({
			body: Joi.object({
				phone: JoiSchemes.phoneNine.required(),
				code: Joi.number().required(),
			}),
		}),
		async (req, res, next) => {
			try {
				if (Verification.verifyCode("998" + req.body.phone, req.body.code)) {
					return res.json({ message: "success" }).status(200);
				}

				throw HttpError(403);
			} catch (e) {
				next(e);
			}
		}
	);
};
