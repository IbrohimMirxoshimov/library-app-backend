const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("../api");
const auth = require("../api/routes/auth");
const config = require("../config");
const path = require("path");
const { isCelebrateError } = require("celebrate");
const webhook = require("../api/routes/webhook");

module.exports = (app) => {
	// statics
	app.use("/files", express.static(path.resolve("files")));

	// The magic package that prevents frontend developers going nuts
	// Alternate description:
	// Enable Cross Origin Resource Sharing to all origins by default
	app.use(cors());

	// Middleware that transforms the raw string of req.body into json
	app.use(
		bodyParser.json({
			limit: "1mb",
		})
	);

	// Load API routes
	app.use(config.api.prefix, routes());
	app.use(config.auth.prefix, auth());
	app.use(config.WEBHOOK_PREFIX, webhook());

	/// catch 404 and forward to error handler
	app.use((req, res, next) => {
		const err = new Error("Not Found");
		err["status"] = 404;
		next(err);
	});

	app.use((err, req, res, next) => {
		if (isCelebrateError(err)) {
			console.log(err);
			const {
				details: [{ message }],
			} = err.details.get("body"); // 'details' is a Map()
			return res.status(400).send({
				message: message,
			});
		}

		return next(err);
	});

	// error handlers
	app.use((err, req, res, next) => {
		/**
		 * Handle 401 thrown by express-jwt library
		 */
		if (err.name === "UnauthorizedError") {
			return res.status(err.status).send({ message: err.message }).end();
		}
		if (err.status) {
			return res.status(err.status).send({ message: err.message }).end();
		}
		return next(err);
	});

	app.use((err, req, res, next) => {
		console.error(err);
		res.status(err.status || 500).json({
			message: err.message,
		});
	});
};
