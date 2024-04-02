const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Rent = sequelize.define(
	"rent",
	{
		leasedAt: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		customId: {
			type: DataTypes.INTEGER,
		},
		returningDate: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		returnedAt: {
			type: DataTypes.DATE,
		},
		rejected: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Rent;
