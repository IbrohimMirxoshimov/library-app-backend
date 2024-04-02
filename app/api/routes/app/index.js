const { Router } = require("express");
const books = require("./books");
const auth = require("./auth");
const account = require("./account");
const news = require("./news");
const stats = require("./stats");
const collections = require("./collections");

module.exports = (app) => {
	const route = Router();

	auth(route);
	books(route);
	account(route);
	news(route);
	stats(route);
	collections(route);

	app.use("/app", route);
};
