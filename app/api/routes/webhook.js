const { Router } = require("express");
const { ESKIZ_WEBHOOK_ROUTE } = require("../../constants/mix");

module.exports = () => {
	const route = Router();

	route.post(ESKIZ_WEBHOOK_ROUTE, async (req, res) => {
		console.log("ESKIZ", req.body, req.query, req.params, req.path);
		res.send().status(200);
	});

	return route;
};
