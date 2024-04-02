const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Town = sequelize.define(
	"town",
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

module.exports = Town;
