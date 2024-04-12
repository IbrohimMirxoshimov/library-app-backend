const { cryllic2Lation } = require("./cryllic2latin");

function makeSearchableString(str) {
	return cryllic2Lation(str).toLowerCase();
}

function upperCaseAndClearOtherChars(str) {
	const s = str.replace(/['`’‘]/g, "'").trim();

	return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateRandomString(length) {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

module.exports = {
	makeSearchableString: makeSearchableString,
	upperCaseAndClearOtherChars: upperCaseAndClearOtherChars,
	generateRandomString,
};
