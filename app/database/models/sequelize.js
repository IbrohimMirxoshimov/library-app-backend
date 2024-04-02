"use strict";

const { Sequelize } = require("sequelize");
const { DATABASE_CONNECTION_STRING } = require("../../config");

const sequelize = new Sequelize(DATABASE_CONNECTION_STRING, {
	dialect: "postgres",
	logging: false,
});

module.exports = sequelize;
