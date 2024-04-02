const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Sms = sequelize.define(
	"sms",
	{
		phone: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			defaultValue: "draft",
			validate: {
				isIn: [["draft", "pending", "done", "error"]],
			},
		},
		short_text: {
			type: DataTypes.TEXT,
		},
	},
	{
		updatedAt: false,
		createdAt: false,
	}
);

module.exports = Sms;
