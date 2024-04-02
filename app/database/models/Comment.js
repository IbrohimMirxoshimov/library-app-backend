const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Comment = sequelize.define("comments", {
	text: {
		type: DataTypes.TEXT,
	},
});

module.exports = Comment;
