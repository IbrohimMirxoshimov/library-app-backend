const { Router } = require("express");
const { ESKIZ_WEBHOOK_ROUTE } = require("../../constants/mix");

module.exports = () => {
	const route = Router();

	route.post(ESKIZ_WEBHOOK_ROUTE, async (req, res, next) => {
		console.log("ESKIZ", req.body);
	});

	return route;
};
