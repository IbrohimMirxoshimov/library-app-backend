const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const routes = require("../api");
const auth = require("../api/routes/auth");
const config = require("../config");
const path = require("path");
const { isCelebrateError } = require("celebrate");
const webhook = require("../api/routes/webhook");
const {
	formatError,
	sequelizeValidationMessage,
} = require("../utils/errors");

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
			// 'details' is a Map(): body, query, params ...
			const [segment] = err.details.values();
			return res.status(400).send({
				message: segment?.details?.[0]?.message || "Noto'g'ri so'rov",
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
		const validationMessage = sequelizeValidationMessage(err);
		if (validationMessage) {
			return res.status(400).json({ message: validationMessage });
		}

		console.error(
			"API 500",
			req.method,
			req.originalUrl,
			"user:",
			req.user?.id,
			"\n" + formatError(err)
		);

		// baza xatosining matni (ustun, so'rov) foydalanuvchiga ko'rsatilmaydi
		const isDbError = String(err.name || "").startsWith("Sequelize");
		res.status(500).json({
			message: isDbError ? "Serverda xatolik yuz berdi" : err.message,
		});
	});
};
