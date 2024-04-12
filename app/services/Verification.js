const { production } = require("../config");
const { Sms } = require("../database/models");
const { SmsProviderType } = require("../database/models/Sms");
const { SmsTemplates, sendSmsViaEskiz } = require("../helpers/SmsProviderApi");

const EXPIRE_TIME_CODE = 1000 * 60 * 5;
const sendedCodes = {};

function clearCode(phone_number) {
	delete sendedCodes[phone_number];
}

function generateSmsCode() {
	return production ? String(Math.floor(Math.random() * 10000)) : 1111;
}

function generateAndSaveCode(phone_number) {
	sendedCodes[phone_number] = generateSmsCode();

	setTimeout(() => clearCode(phone_number), EXPIRE_TIME_CODE);
}

const Verification = {
	async sendCode(phone_number, userId) {
		const text = SmsTemplates.verificationCode.getText(
			generateAndSaveCode(phone_number)
		);

		const { message_id } = await sendSmsViaEskiz({
			phone_number: phone_number,
			text: text,
		});

		await Sms.create({
			text,
			phone: phone_number,
			userId: userId,
			provider: SmsProviderType.eskiz,
			provider_message_id: message_id,
		});
	},
	verifyCode(phone_number, code) {
		if (sendedCodes[phone_number] === code) {
			delete sendedCodes[phone_number];
			return true;
		}

		return false;
	},
};

module.exports = Verification;
