const config = require("./app/config");
const express = require("express");
const Logger = require("./app/loaders/logger");

async function main() {
	const app = express();

	await require("./app/loaders")(app);

	app
		.listen(config.PORT, () => {
			Logger.info(`Server listening on port: ${config.PORT}`);
		})
		.on("error", (err) => {
			Logger.error(err);
			process.exit(1);
		});

	process.addListener("uncaughtException", (e) => {
		console.error("Custom Unhandled Exception", e);
	});

	process.addListener("unhandledRejection", (e) => {
		console.error("Custom Unhandled Rejection", e);
	});
}

main();
