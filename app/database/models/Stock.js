const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Stock = sequelize.define(
	"stocks",
	{
		busy: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Stock;
