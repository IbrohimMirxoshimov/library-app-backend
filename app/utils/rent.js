function getDateReadable(str) {
	return new Date(str).toLocaleDateString("ru");
}
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const getRamainedDays = (rent) => {
	let remain = new Date(rent.returningDate) - new Date();
	let remainDays = Math.floor(remain / ONE_DAY_IN_MS);

	return remainDays + 1;
};

const getRentDurationInDays = (rent) => {
	return (
		(new Date(rent.returningDate) - new Date(rent.leasedAt)) / ONE_DAY_IN_MS
	);
};

function getComments(comments) {
	if (!comments?.length) {
		return "";
	}

	return (
		"Ijaraga izohlari:\n" +
		comments
			.map(
				(c, i) => `${i + 1}) ${c.createdAt.toLocaleDateString("ru")}\n${c.text}`
			)
			.join("\n")
	);
}

function getReportText({ count, rows }) {
	const reportRows = rows.map(
		(row) =>
			`Kvitansiya: ${row.id}\nBerilgan: ${getDateReadable(
				row.leasedAt
			)}\nOxirgi muddat: ${getDateReadable(
				row.returningDate
			)}\nO'tib ketti: ${getRamainedDays(row)}\nKitob: ${row.stock.id} - ${
				row.stock.book.name
			}\nKitobxon: ${row.user.id}. ${row.user.firstName} ${
				row.user.lastName
			}\nTel: ${row.user.phone} ${row.user.extraPhone || ""}\n\n${getComments(
				row.comments
			)}`
	);

	return {
		total: count,
		items: reportRows,
	};
}

function getLibraryHolidays() {
	return [
		"2024-04-09",
		"2024-04-10",
		"2024-04-11",
		"2024-04-12",
		"2024-04-13",
		"2024-05-09",
		"2024-08-30",
		"2024-08-31",
		"2024-09-01",
		"2024-10-01",
		"2024-12-31",
		"2025-01-01",
		"2025-01-02",
		"2025-01-03",
	];
}

function getReturningDateIfIsNotWorkingDay(rent) {
	const config = {
		holidays: getLibraryHolidays(),
		sundayIndexOnWeek: 5,
	};

	return getAvailableDayForReturn(rent.returningDate, config);
}

function getNextDayISOString(date) {
	date.setDate(date.getDate() + 1);
	return date.toISOString();
}

function getAvailableDayForReturn(returningDate, config) {
	if (new Date(returningDate).getDay() === config.sundayIndexOnWeek) {
		// if this day is Friday change returningDate to next day
		return getAvailableDayForReturn(
			getNextDayISOString(new Date(returningDate)),
			config
		);
	}

	if (getLibraryHolidays().includes(returningDate.slice(0, 10))) {
		return getAvailableDayForReturn(
			getNextDayISOString(new Date(returningDate)),
			config
		);
	}

	return returningDate;
}

module.exports = {
	getReportText: getReportText,
	getReturningDateIfIsNotWorkingDay: getReturningDateIfIsNotWorkingDay,
	getRentDurationInDays: getRentDurationInDays,
};
