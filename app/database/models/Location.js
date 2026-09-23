const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Location = sequelize.define(
	"location",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		link: {
			type: DataTypes.STRING,
		},
		active: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		description: {
			type: DataTypes.TEXT,
		},
		telegramChatId: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		// zarur kitob bilan boshqa kitob berilmasligi tekshiruvi
		requiredBookGuard: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Location;
