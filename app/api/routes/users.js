const { Router } = require("express");
const { celebrate, Joi } = require("celebrate");
const UserController = require("../../controllers/user");
const User = require("../../database/models/User");
const { JoiSchemes } = require("../../helpers/validators");
const middlewares = require("../middlewares");
const { isOwner, isLibrarian } = require("../middlewares/permissions");
const route = Router();

const smsCode = Joi.alternatives().try(Joi.string(), Joi.number());

module.exports = (app) => {
	app.use("/users", middlewares.isAuth, isLibrarian, route);

	route.get("/", UserController.getList());
	route.get("/lookup", UserController.lookup());
	route.get("/:id", UserController.getOne());
	route.post("/", UserController.add());
	route.put(
		"/:id/phone",
		celebrate({
			body: Joi.object({
				phone: JoiSchemes.phoneNine.required(),
				code: smsCode.optional(),
			}),
		}),
		UserController.changePhone()
	);
	route.post(
		"/:id/verify-phone",
		celebrate({
			body: Joi.object({
				code: smsCode.required(),
			}),
		}),
		UserController.verifyPhone()
	);
	route.post(
		"/:id/link",
		celebrate({
			body: Joi.object({
				passportId: Joi.string().required(),
				birthDate: Joi.string().required(),
			}),
		}),
		UserController.link()
	);
	route.put("/:id", UserController.update());
	route.delete("/:id", isOwner, middlewares.destroy(User));
};
