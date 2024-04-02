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

module.exports = {
	getOneMonthBackDate: getOneMonthBackDate,
	getOneWeekBackDate: getOneWeekBackDate,
	getOneDayBackDate: getOneDayBackDate,
};
