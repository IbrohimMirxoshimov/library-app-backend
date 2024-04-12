const { SmsProviderType } = require("../../constants/mix");
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
		text: {
			type: DataTypes.TEXT,
		},
		provider: {
			type: DataTypes.INTEGER,
			validate: {
				isIn: [
					[
						SmsProviderType.eskiz,
						SmsProviderType.manual,
						SmsProviderType.play_mobile,
					],
				],
			},
		},
		provider_message_id: {
			type: DataTypes.STRING,
		},
	},
	{
		updatedAt: false,
		createdAt: false,
	}
);

module.exports = Sms;
