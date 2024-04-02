const News = require("../../../database/models/News");
const middlewares = require("../../middlewares");

module.exports = (app) => {
	app.use("/news", middlewares.getList(News));
};
