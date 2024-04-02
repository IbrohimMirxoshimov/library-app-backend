const { Collection } = require("../../../database/models");
const middlewares = require("../../middlewares");

module.exports = (app) => {
	app.use("/collections", middlewares.getList(Collection));
};
