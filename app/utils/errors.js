// Telegram ning odatiy javoblari (kitobxon botni bloklagan, callback eskirgan va h.k.) -
// bular xato emas, logga yozilmaydi
const BENIGN_TELEGRAM_ERRORS = [
	/bot was blocked by the user/,
	/user is deactivated/,
	/chat not found/,
	/query is too old/,
	/message is not modified/,
];

function isBenignTelegramError(e) {
	const description = e?.response?.description || "";
	return (
		e?.name === "TelegramError" &&
		BENIGN_TELEGRAM_ERRORS.some((pattern) => pattern.test(description))
	);
}

// bot tokeni xato matnidagi URL larda bo'ladi - logga tushmasin
function redactSecrets(text) {
	return String(text).replace(/bot\d+:[A-Za-z0-9_-]+/g, "bot<TOKEN>");
}

function formatError(e) {
	let text = e?.stack || e?.message || String(e);
	if (e?.on?.method) text += `\nTelegram method: ${e.on.method}`;
	if (e?.original?.message) text += `\nDB: ${e.original.message}`;
	return redactSecrets(text);
}

const UNIQUE_FIELD_MESSAGES = {
	passportId: "Bu passport raqami bazada mavjud",
	username: "Bu login band",
	pinfl: "Bu PINFL bazada mavjud",
};

// Sequelize validatsiya xatolari - foydalanuvchi kiritgan ma'lumotdagi xato (400)
function sequelizeValidationMessage(err) {
	if (err?.name === "SequelizeUniqueConstraintError") {
		const fields = (err.errors || []).map((e) => e.path).filter(Boolean);
		return (
			fields.map((f) => UNIQUE_FIELD_MESSAGES[f]).find(Boolean) ||
			`Bu qiymat bazada mavjud: ${fields.join(", ")}`
		);
	}

	if (err?.name === "SequelizeValidationError") {
		return (err.errors || []).map((e) => e.message).join("; ") || err.message;
	}

	return null;
}

module.exports = {
	isBenignTelegramError,
	redactSecrets,
	formatError,
	sequelizeValidationMessage,
};
