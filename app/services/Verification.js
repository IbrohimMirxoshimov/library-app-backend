const { production } = require("../config");
const { SmsProviderType } = require("../constants/mix");
const { Sms } = require("../database/models");
const { SmsTemplates, sendSmsViaEskiz } = require("../helpers/SmsProviderApi");
const HttpError = require("../utils/HttpError");

const EXPIRE_TIME_CODE = 1000 * 60 * 5;
// bitta raqamga qayta sms yuborish oralig'i (sms pullik)
const RESEND_INTERVAL = 1000 * 60;
const MAX_ATTEMPTS = 5;

// phone_number -> { code, expiresAt, sentAt, attempts }
const sendedCodes = {};

function generateSmsCode() {
	if (!production) return "1111";

	return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

const Verification = {
	async sendCode(phone_number, userId) {
		const existing = sendedCodes[phone_number];

		if (existing && Date.now() - existing.sentAt < RESEND_INTERVAL) {
			const seconds = Math.ceil(
				(RESEND_INTERVAL - (Date.now() - existing.sentAt)) / 1000
			);
			throw HttpError(
				429,
				`Kod yuborilgan. Qayta yuborish uchun ${seconds} soniya kuting`
			);
		}

		const code = generateSmsCode();
		const text = SmsTemplates.verificationCode.getText(code);

		const { message_id } = await sendSmsViaEskiz({
			phone_number: phone_number,
			text: text,
		});

		sendedCodes[phone_number] = {
			code,
			sentAt: Date.now(),
			expiresAt: Date.now() + EXPIRE_TIME_CODE,
			attempts: 0,
		};

		await Sms.create({
			text,
			phone: phone_number,
			userId: userId,
			provider: SmsProviderType.eskiz,
			provider_message_id: message_id,
		});
	},
	verifyCode(phone_number, code) {
		const saved = sendedCodes[phone_number];

		if (!saved) return false;

		if (Date.now() > saved.expiresAt) {
			delete sendedCodes[phone_number];
			return false;
		}

		// InputNumber "0042" ni 42 qilib yuborishi mumkin
		if (String(code).padStart(4, "0") === saved.code) {
			delete sendedCodes[phone_number];
			return true;
		}

		saved.attempts += 1;
		if (saved.attempts >= MAX_ATTEMPTS) {
			delete sendedCodes[phone_number];
		}

		return false;
	},
};

module.exports = Verification;
