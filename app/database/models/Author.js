const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Author = sequelize.define(
	"author",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Author;
