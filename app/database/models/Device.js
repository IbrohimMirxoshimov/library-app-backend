const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Device = sequelize.define(
	"devices",
	{
		brand: {
			type: DataTypes.STRING,
		},
		model: {
			type: DataTypes.STRING,
		},
		buildId: {
			type: DataTypes.STRING,
		},
		fcmToken: {
			type: DataTypes.STRING,
		},
		enabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Device;
