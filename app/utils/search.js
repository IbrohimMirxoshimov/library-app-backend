const { Op, Sequelize } = require("sequelize");

// Qidiruv normalizatsiyasi (JS va SQL tomonda aynan bir xil):
// 1. kichik harf
// 2. apostroflar (' ` ‘ ’ ʻ ʼ) olib tashlanadi: go'zal = go‘zal = gozal
// 3. h -> x: ibrohim = ibroxim
// Dashboard'dagi src/utils/search.js ham shu qoidalar bilan ishlaydi.
const APOSTROPHES = "'`‘’ʻʼ";
const APOSTROPHE_REGEX = new RegExp(`[${APOSTROPHES}]`, "g");

function normalizeSearchText(str) {
	return String(str ?? "")
		.replace(/İ/g, "I") // Postgres lower('İ') = 'i', JS esa "i̇" qaytaradi
		.toLowerCase()
		.replace(/\0/g, "")
		.replace(APOSTROPHE_REGEX, "")
		.replace(/h/g, "x");
}

// So'rovni normallashtirilgan so'zlarga bo'lish (tartib ahamiyatsiz, har biri alohida qidiriladi)
function getSearchWords(q) {
	return [...new Set(normalizeSearchText(q).split(/\s+/).filter(Boolean))];
}

// Harf (yoki non-ASCII belgi) bo'lmasa (id, telefon raqam) normalizatsiya natijaga ta'sir qilmaydi
function hasLetters(word) {
	return /[^\x00-\x7f]|[a-z]/i.test(word);
}

// LIKE wildcard'larini (% _ \) oddiy belgi qilish (Postgres default escape: \)
function escapeLike(str) {
	return str.replace(/[\\%_]/g, "\\$&");
}

// standard_conforming_strings = on (Postgres default): faqat ' ni ikkilantirish yetarli
function sqlString(str) {
	return `'${String(str).replace(/\0/g, "").replace(/'/g, "''")}'`;
}

// translate(): "to" da jufti yo'q belgilar o'chiriladi (h -> x, apostroflar -> "")
const NORMALIZE_FROM_SQL = sqlString("h" + APOSTROPHES);
// Bo'shliqlarni ham o'chiradi - faqat "boshlanishi bo'yicha" tartiblash uchun
const NORMALIZE_COMPACT_FROM_SQL = sqlString("h" + APOSTROPHES + " ");

function normalizeSql(expr) {
	return `translate(lower(${expr}), ${NORMALIZE_FROM_SQL}, 'x')`;
}

function normalizeCompactSql(expr) {
	return `translate(lower(${expr}), ${NORMALIZE_COMPACT_FROM_SQL}, 'x')`;
}

function identitySql(expr) {
	return expr;
}

/**
 * Har bir so'z qidiruv satrida bo'lishi kerak (AND, tartib ahamiyatsiz).
 * getHaystackSql(norm) - qidiruv satri SQL'i; matnli maydonlarni norm(...) ichiga oling.
 * id prefikslari ('i', 'u', 'b' ...) kichik harf va h/x emas - ular normallashtirilmasa ham bo'ladi.
 * So'rovda harf bo'lmasa norm = identity (lower/translate chaqirilmaydi - tezroq).
 * @returns where sharti yoki null (so'z yo'q bo'lsa)
 */
function searchWhere(q, getHaystackSql) {
	const words = getSearchWords(q);
	if (!words.length) return null;

	const norm = words.some(hasLetters) ? normalizeSql : identitySql;
	const haystack = Sequelize.literal(`(${getHaystackSql(norm)})`);

	// "LIKE ALL (ARRAY[...])" - qidiruv satri har qatorda bir marta hisoblanadi (har so'z uchun emas)
	const patterns = words.map((word) => `%${escapeLike(word)}%`);
	return Sequelize.where(haystack, {
		[Op.like]: patterns.length === 1 ? patterns[0] : { [Op.all]: patterns },
	});
}

/**
 * Asosiy nomi so'rov bilan boshlanadiganlar birinchi:
 * 0 - nom butun so'rov bilan boshlanadi, 1 - birinchi so'z bilan, 2 - qolganlari.
 * nameSqls - asosiy nom SQL ifodalari (NULL bo'lmasligi kerak), istalgan biri mos kelsa yetarli.
 * @returns order elementi ([literal, "ASC"]) yoki null
 */
function searchRankOrder(q, nameSqls) {
	const words = getSearchWords(q);
	if (!words.some(hasLetters)) return null;

	const names = nameSqls.map(normalizeCompactSql);
	const startsWith = (prefix) =>
		names
			.map((name) => `${name} LIKE ${sqlString(escapeLike(prefix) + "%")}`)
			.join(" OR ");

	let cases = `WHEN ${startsWith(words.join(""))} THEN 0`;
	if (words.length > 1) {
		cases += ` WHEN ${startsWith(words[0])} THEN 1`;
	}

	return [Sequelize.literal(`(CASE ${cases} ELSE 2 END)`), "ASC"];
}

module.exports = {
	normalizeSearchText,
	getSearchWords,
	escapeLike,
	normalizeSql,
	searchWhere,
	searchRankOrder,
};
