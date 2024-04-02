const AuthService = require("../../services/auth");
const { setSession } = require("../../helpers/session");
const { celebrate, Joi } = require("celebrate");
const { Router } = require("express");
const { JWT_EXPIRATION_TIME } = require("../../config");
const route = Router();

module.exports = () => {
	route.post(
		"/signin",
		celebrate({
			body: Joi.object({
				username: Joi.string().min(4).required(),
				password: Joi.string().min(4).required(),
			}),
		}),
		async (req, res, next) => {
			try {
				const { username, password } = req.body;
				const { user, token } = await AuthService.SignIn(username, password);

				setSession(token, {
					expireTime: Date.now() + JWT_EXPIRATION_TIME,
					...user,
				});

				return res.json({ user, token }).status(200);
			} catch (e) {
				return next(e);
			}
		}
	);

	return route;
};
