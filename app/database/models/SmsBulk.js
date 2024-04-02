const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const SmsBulk = sequelize.define(
	"smsbulk",
	{
		text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = SmsBulk;
