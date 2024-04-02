const { PM_SMS_USERNAME, PM_SMS_PASSWORD, production } = require("../config");

const SmsService = {
	async sendSMSViaPlayMobile(phone_number, text, messageId) {
		if (
			!(
				typeof text === "string" &&
				text.length &&
				typeof phone_number === "string" &&
				phone_number.length === 12
			)
		) {
			throw new Error("Bad arguments");
		}

		if (!production) return "";

		return axios.post(
			"http://91.204.239.44/broker-api/send",
			{
				messages: [
					{
						recipient: phone_number,
						"message-id": messageId,
						sms: {
							originator: "3700",
							content: {
								text: text,
							},
						},
					},
				],
			},
			{
				auth: {
					username: PM_SMS_USERNAME,
					password: PM_SMS_PASSWORD,
				},
			}
		);
	},
};

module.exports = SmsService;
