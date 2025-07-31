const { Joi, celebrate } = require("celebrate");
const { Router } = require("express");
const RentController = require("../../controllers/rent");
const middlewares = require("../middlewares");
const { isLibrarian } = require("../middlewares/permissions");
const route = Router();

const addToRentValidator = celebrate({
	body: Joi.object({
		userId: Joi.number().required(),
		stockId: Joi.number().required(),
		leasedAt: Joi.string().required(),
		returningDate: Joi.string().required(),
		customId: Joi.number().optional(),
	}),
});

module.exports = (app) => {
	app.use("/rents", middlewares.isAuth, isLibrarian, route);

	route.get("/", RentController.getList());
	route.get("/report", RentController.report());
	route.get("/:id", RentController.getOne());
	route.post(
		"/check-to-add",
		addToRentValidator,
		RentController.checkToAdd()
	);
	route.post("/", addToRentValidator, RentController.add());
	route.put("/:id/return", RentController.return());
	route.put(
		"/:id/return-with-custom-id",
		RentController.returnWithCustomid()
	);
	route.put("/:id/reject", RentController.reject());
	route.delete("/:id", RentController.delete());
	route.put("/:id", RentController.edit());
};
