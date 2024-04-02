const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Region = sequelize.define(
	"region",
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

module.exports = Region;
