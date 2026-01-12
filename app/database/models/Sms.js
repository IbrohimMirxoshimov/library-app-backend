const { SmsProviderType, SmsStatusEnum } = require("../../constants/mix");
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
				isIn: [Object.values(SmsStatusEnum)],
			},
		},
		error_reason: {
			type: DataTypes.STRING,
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
						SmsProviderType.gateway,
					],
				],
			},
		},
		provider_message_id: {
			type: DataTypes.STRING,
		},
		receivedAt: {
			type: DataTypes.DATE,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		updatedAt: true,
		createdAt: false,
		indexes: [
			{
				name: "sms_user_id_phone_updated_at_index",
				fields: [
					"userId",
					"phone",
					{ name: "updatedAt", order: "DESC" },
				],
			},
			{
				name: "sms_user_id_updated_at_index",
				fields: ["userId", { name: "updatedAt", order: "DESC" }],
			},
		],
	}
);

module.exports = Sms;
