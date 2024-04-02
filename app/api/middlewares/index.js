const add = require("./add");
const getList = require("./getList");
const edit = require("./edit");
const getOne = require("./getOne");
const isAuth = require("./isAuth");
const destroy = require("./destroy");

module.exports = {
	isAuth: isAuth,
	getOne: getOne,
	getList: getList,
	add: add,
	edit: edit,
	destroy: destroy,
};
