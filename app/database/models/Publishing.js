const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Publishing = sequelize.define(
	"publishing",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Publishing;
