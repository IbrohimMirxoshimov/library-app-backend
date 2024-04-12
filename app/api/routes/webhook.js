const { Router } = require("express");
const { ESKIZ_WEBHOOK_ROUTE } = require("../../constants/mix");
const multer = require("multer");
const upload = multer();

module.exports = () => {
	const route = Router();

	route.post(ESKIZ_WEBHOOK_ROUTE, upload.none(), async (req, res) => {
		console.log("ESKIZ", req.body);
		res.send().status(200);
	});

	return route;
};
