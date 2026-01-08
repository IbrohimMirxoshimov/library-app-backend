const { Router } = require("express");
const users = require("./routes/users");
const regions = require("./routes/regions");
const locations = require("./routes/locations");
const booksgroups = require("./routes/booksgroups");
const stocks = require("./routes/stocks");
const publishings = require("./routes/publishings");
const rents = require("./routes/rents");
const collections = require("./routes/collections");
const comments = require("./routes/comments");
const books = require("./routes/books");
const authors = require("./routes/authors");
const app = require("./routes/app");
const news = require("./routes/news");
const verification = require("./routes/verification");
const sms = require("./routes/sms");
const towns = require("./routes/towns");
const stats = require("./routes/stats");
const gateway = require("./routes/gateway");

module.exports = () => {
	const main = Router();

	app(main);
	users(main);
	regions(main);
	locations(main);
	booksgroups(main);
	stocks(main);
	publishings(main);
	rents(main);
	collections(main);
	books(main);
	authors(main);
	comments(main);
	news(main);
	verification(main);
	sms(main);
	towns(main);
	stats(main);
	gateway(main);

	return main;
};
