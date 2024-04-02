const { cryllic2Lation } = require("./cryllic2latin");

function makeSearchableString(str) {
	return cryllic2Lation(str).toLowerCase();
}

function upperCaseAndClearOtherChars(str) {
	const s = str.replace(/['`’‘]/g, "'").trim();

	return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
	makeSearchableString: makeSearchableString,
	upperCaseAndClearOtherChars: upperCaseAndClearOtherChars,
};
