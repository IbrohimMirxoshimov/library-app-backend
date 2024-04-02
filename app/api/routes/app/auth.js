const AuthService = require("../../../services/auth");
const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
// const { sendCode } = require("../../../services/Verification");
const HttpError = require("../../../utils/HttpError");
const { JoiSchemes } = require("../../../helpers/validators");

module.exports = (app) => {
	const route = Router();

	route
		.post(
			"/check-phone",
			celebrate({
				body: Joi.object({
					phone: JoiSchemes.phoneNine.required(),
				}),
			}),
			async (req, res, next) => {
				try {
					let result = await AuthService.CheckPhone(req.body.phone);

					if (!result) throw HttpError(404);

					return res.json({ message: "Found" }).status(200);
				} catch (e) {
					return next(e);
				}
			}
		)
		.post(
			"/send-code",
			celebrate({
				body: Joi.object({
					phone: JoiSchemes.phoneNine.required(),
				}),
			}),
			async (req, res, next) => {
				try {
					// await sendCode(req.body.phone);

					return res.json({ message: "success" }).status(200);
				} catch (e) {
					return next(e);
				}
			}
		)
		.post(
			"/sign-up",
			celebrate({
				body: Joi.object({
					firstName: Joi.string().min(2).required(),
					lastName: Joi.string().min(2).required(),
					password: Joi.string().min(6).required(),
					phone: JoiSchemes.phoneNine.required(),
					code: Joi.string().required(),
				}),
			}),
			async (req, res, next) => {
				try {
					let user = await AuthService.SignUpWithPhoneValidation(req.body);

					return res.json(user).status(200);
				} catch (e) {
					return next(e);
				}
			}
		);

	app.use("/auth", route);
};
