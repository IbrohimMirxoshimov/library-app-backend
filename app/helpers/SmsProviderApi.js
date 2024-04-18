const { default: axios } = require("axios");
const {
	PLAYMOBILE_USERNAME,
	PLAYMOBILE_PASSWORD,
	ESKIZ_EMAIL,
	ESKIZ_PASSWORD,
	WEBHOOK_PREFIX,
	APP_ORIGIN,
	production,
} = require("../config");
const { generateRandomString } = require("../utils/string");
const { ESKIZ_WEBHOOK_ROUTE } = require("../constants/mix");

const eskizToken = {
	token: "",
	expDateInSecond: 0,
};

exports.SmsTemplates = {
	rentExpiredWithCustomLinkNew: {
		id: 5824,
		getText: ({ fullName, url_param, shortFullName = "" }) => {
			const template = (name, url_param) =>
				`${clearText(
					name
				)} ijaraga olgan kitobingiz vaqtidan kechikibdi\nBepul kutubxonaga zarar keltirmaylik\nHavolaga kiring!\nmehrkutubxonasi.uz/s/${url_param}`;

			const text = template(fullName, url_param);

			if (text.length > 160 && shortFullName) {
				return template(shortFullName, url_param);
			}

			return text;
		},
	},
	rentExpiredWithCustomLink: {
		id: 10183,
		getText: ({ fullName, url_param, shortFullName = "" }) => {
			const template = (name, url_param) =>
				`${clearText(
					name
				)} ijraga olgan kitobingiz vaqtidan kechikibdi\nKechiktirishingiz kutubxonaga katta zarar\n\nHavolaga kiring!\nmehrkutubxonasi.uz/s/${url_param}`;

			const text = template(fullName, url_param);

			if (text.length > 160 && shortFullName) {
				return template(shortFullName, url_param);
			}

			return text;
		},
	},
	forExtraPhone: {
		id: 9912,
		getText: (fullName, librarianPhone) =>
			`Sizni ${fullName} tanishi sifatida raqamingizni qoldirdi. Agar bu insonni tanimasangiz ${librarianPhone} raqamiga qo'ng'iroq qiling`,
	},
	verificationCode: {
		id: 9911,
		getText: (code) => `Tasdiqlash kodi: ${code}\nMehr kutubxonasi`,
	},
};

// 30 kunda expire bo'ladi o'zi
const EXP_TIME_ESKIZ_IN_MS = 1000 * 60 * 60 * 24 * 29;

async function getEskizAuthToken() {
	if (Date.now() < eskizToken.expDateInSecond) {
		return eskizToken.token;
	}

	const res = await axios.post(`https://notify.eskiz.uz/api/auth/login`, {
		email: ESKIZ_EMAIL,
		password: ESKIZ_PASSWORD,
	});

	eskizToken.token = res.data.data.token;
	eskizToken.expDateInSecond = Date.now() + EXP_TIME_ESKIZ_IN_MS;

	return eskizToken.token;
}

function clearText(text) {
	const matched = text.match(/[A-Z '`‘]+/gi);

	if (matched) {
		return matched.join(" ").replace(/`‘/g, "'");
	}

	const onlyABC = text.match(/[A-Z ]/gi);

	if (onlyABC) {
		return onlyABC.join(" ");
	}

	throw new Error("Text clearing error: " + text);
}
function smsCharsLimit(text) {
	if (text.length > 160) {
		throw new Error("Sms char limit error");
	}

	return text;
}

exports.sendSmsViaEskiz = async function sendSmsViaEskiz({
	phone_number,
	text,
	callback_url = APP_ORIGIN + WEBHOOK_PREFIX + ESKIZ_WEBHOOK_ROUTE,
}) {
	smsCharsLimit(text);
	const token = await getEskizAuthToken();

	if (!production) {
		return {
			message_id: "res.data.id",
		};
	}
	const message_id = `E_${generateRandomString(10)}`;

	await axios.post(
		`https://notify.eskiz.uz/api/message/sms/send`,
		{
			mobile_phone: phone_number,
			message: text,
			from: 4546,
			callback_url,
			user_sms_id: message_id,
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		}
	);

	return {
		message_id: message_id,
	};
};

exports.sendBatchSmsViaEskiz = async function sendSmsViaEskiz({
	messages,
	callback_url = APP_ORIGIN + WEBHOOK_PREFIX + ESKIZ_WEBHOOK_ROUTE,
}) {
	const preparedMessagesData = messages.map((message) => {
		smsCharsLimit(message.text);
		const message_id = `E_${generateRandomString(10)}`;

		return {
			to: message.phone_number,
			user_sms_id: message_id,
			text: message.text,
		};
	});

	if (!production) {
		return preparedMessagesData;
	}

	await axios.post(
		`https://notify.eskiz.uz/api/message/sms/send-batch`,
		{
			messages: preparedMessagesData,
			from: 4546,
			callback_url,
			dispatch_id: `ed_${generateRandomString(10)}`,
		},
		{
			headers: { Authorization: `Bearer ${await getEskizAuthToken()}` },
		}
	);

	return preparedMessagesData;
};

exports.sendSMSViaPlayMobile = async function sendSMSViaPlayMobile({
	phone_number,
	text,
}) {
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

	smsCharsLimit(text);
	// if (!production) return;
	const message_id = generateRandomString(10);
	await axios.post(
		"http://91.204.239.44/broker-api/send",
		{
			messages: [
				{
					recipient: phone_number,
					"message-id": message_id,
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
				username: PLAYMOBILE_USERNAME,
				password: PLAYMOBILE_PASSWORD,
			},
		}
	);

	return {
		meesage_id: message_id,
	};
};
