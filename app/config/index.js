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
	WEBHOOK_PREFIX: process.env.WEBHOOK_PREFIX,
	APP_ORIGIN: process.env.APP_ORIGIN,
	JWT_EXPIRATION_TIME: 12 * 24 * 60 * 60 * 1000,
	ATTACHMENTS_CHANNEL_ID: process.env.ATTACHMENTS_CHANNEL_ID,
	MAIN_GROUP_CHAT_ID: process.env.MAIN_GROUP_CHAT_ID,
	MAIN_CHANNEL_CHAT_ID: process.env.MAIN_CHANNEL_CHAT_ID,
	DONATION_CHANNEL_CHAT_ID: process.env.DONATION_CHANNEL_CHAT_ID,
	MAIN_BOT_USERNAME: process.env.MAIN_BOT_USERNAME,
	PLAYMOBILE_USERNAME: process.env.PLAYMOBILE_USERNAME,
	PLAYMOBILE_PASSWORD: process.env.PLAYMOBILE_PASSWORD,
	ESKIZ_EMAIL: process.env.ESKIZ_EMAIL,
	ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD,
};
