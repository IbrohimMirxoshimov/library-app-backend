const { production } = require("../config");
const { Sms } = require("../database/models");
const { sendSMSViaPlayMobile } = require("./SmsService");
const EXPIRE_TIME_CODE = 1000 * 60 * 5;
const sendedCodes = {};

function clearCode(phone_number) {
	delete sendedCodes[phone_number];
}

function generateAndSaveCode(phone_number) {
	const code = production ? String(Math.floor(Math.random() * 10000)) : 1111;
	sendedCodes[phone_number] = code;
	setTimeout(() => clearCode(phone_number), EXPIRE_TIME_CODE);
}

const Verification = {
	async sendCode(phone_number, userId) {
		const text = `Mehr kutubxonasi\nTasdiqlash kodi: ${generateAndSaveCode(
			phone_number
		)}`;
		const sms = await Sms.create({ text, phone: phone_number, userId: userId });

		await sendSMSViaPlayMobile(phone_number, text, sms.id);
		return sms.toJSON();
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
