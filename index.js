// server IPv6 route to api.telegram.org is flaky, prefer IPv4
require("dns").setDefaultResultOrder("ipv4first");

const config = require("./app/config");
const express = require("express");
const Logger = require("./app/loaders/logger");
const { formatError, isBenignTelegramError } = require("./app/utils/errors");

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
		console.error("Custom Unhandled Exception", formatError(e));
	});

	process.addListener("unhandledRejection", (e) => {
		if (isBenignTelegramError(e)) return;
		console.error("Custom Unhandled Rejection", formatError(e));
	});
}

main();
