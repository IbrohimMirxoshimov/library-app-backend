const loadBot = require("../bot/core");
const { production } = require("../config");
const db = require("../database/models");
const Crons = require("../services/Crons");
const expressLoader = require("./express");
const Logger = require("./logger");

module.exports = async (app) => {
	await db.sequelize.authenticate();
	Logger.info("✌️ DB loaded and connected!");

	await expressLoader(app);
	Logger.info("✌️ Express loaded");

	if (!production) return true;
	loadBot();
	Logger.info("✌️ Bot started");

	await Crons.loadCrons();
	Logger.info("✌️ Crons has loaded");
	return true;
};
