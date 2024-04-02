const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const News = sequelize.define(
	"news",
	{
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		content: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		image: {
			type: DataTypes.STRING,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = News;
