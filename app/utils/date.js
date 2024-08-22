function getOneMonthBackDate(date = new Date()) {
	date.setMonth(date.getMonth() - 1);
	return date;
}

function getOneWeekBackDate(date = new Date()) {
	date.setDate(date.getDate() - 7);
	return date;
}

function getOneDayBackDate(date = new Date(), day = 1) {
	date.setDate(date.getDate() - day);
	return date;
}

function getLastDateOfMonth(date = new Date()) {
	return getEndOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function getFirstDateOfMonth(date = new Date()) {
	return getStartOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function getPreviousMonth(date = new Date()) {
	date.setMonth(date.getMonth() - 1); // Subtract one month
	return date;
}

function getStartOfDay(date = new Date()) {
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	date.setMilliseconds(0);

	return date;
}

function getEndOfDay(date = new Date()) {
	date.setHours(23);
	date.setMinutes(59);
	date.setSeconds(59);
	date.setMilliseconds(0);
	return date;
}

function getFirstAndLastDateOfMonth(date = new Date()) {
	return {
		first: getFirstDateOfMonth(date),
		last: getLastDateOfMonth(date),
	};
}

const month = [
	"Yanvar",
	"Fevral",
	"Mart",
	"Aprel",
	"May",
	"Iyun",
	"Iyul",
	"Avgust",
	"Sentabr",
	"Oktabr",
	"Noyabr",
	"Dekabr",
];

function getDateMonthInUzbek(date = new Date()) {
	return month[date.getMonth()];
}

module.exports = {
	getOneMonthBackDate: getOneMonthBackDate,
	getOneWeekBackDate: getOneWeekBackDate,
	getOneDayBackDate: getOneDayBackDate,
	getEndOfDay,
	getStartOfDay,
	getPreviousMonth,
	getLastDateOfMonth,
	getFirstDateOfMonth,
	getFirstAndLastDateOfMonth,
	getDateMonthInUzbek,
};
