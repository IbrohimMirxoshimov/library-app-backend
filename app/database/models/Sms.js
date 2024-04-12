const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");
const SmsProviderType = {
	play_mobile: 1,
	eskiz: 2,
	manual: 3,
};
exports.SmsProviderType = SmsProviderType;

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
