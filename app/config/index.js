require("dotenv").config();

module.exports = {
	production: process.env.NODE_ENV === "production",
	DEV_ID: process.env.DEV_ID,
	TOKEN: process.env.TOKEN,
	DATABASE_CONNECTION_STRING: process.env.DATABASE,
	PORT: parseInt(process.env.PORT),
	jwtSecret: process.env.JWT_SECRET,
	jwtAlgorithm: process.env.JWT_ALGO,
	logs: {
		level: process.env.LOG_LEVEL || "silly",
	},
	api: {
		prefix: "/api",
	},
	auth: {
		prefix: "/auth",
	},
	JWT_EXPIRATION_TIME: 12 * 24 * 60 * 60 * 1000,
	ATTACHMENTS_CHANNEL_ID: process.env.ATTACHMENTS_CHANNEL_ID,
	MAIN_GROUP_CHAT_ID: process.env.MAIN_GROUP_CHAT_ID,
	MAIN_CHANNEL_CHAT_ID: process.env.MAIN_CHANNEL_CHAT_ID,
	DONATION_CHANNEL_CHAT_ID: process.env.DONATION_CHANNEL_CHAT_ID,
	PM_SMS_USERNAME: process.env.PM_SMS_USERNAME,
	PM_SMS_PASSWORD: process.env.PM_SMS_PASSWORD,
	MAIN_BOT_USERNAME: process.env.MAIN_BOT_USERNAME,
	SEND_SMS_URL: process.env.SMS_URL,
	SMS_AUTH_URL: process.env.SMS_AUTH_URL,
	SMS_AUTH_LOGIN: process.env.SMS_AUTH_LOGIN,
	SMS_AUTH_PASSWORD: process.env.SMS_AUTH_PASSWORD,
};
