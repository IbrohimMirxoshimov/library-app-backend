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
	// Friday is already a day off (handled in getAvailableDayForReturn),
	// so any holiday that lands on a Friday is intentionally omitted below.
	return [
		// new year — 31 Dec 2025 .. 4 Jan 2026 (02 Jan is Friday)
		"2025-12-31", // Wed
		"2026-01-01", // Thu
		"2026-01-03", // Sat
		"2026-01-04", // Sun
		// women's day — 7..9 Mar
		"2026-03-07", // Sat
		"2026-03-08", // Sun
		"2026-03-09", // Mon
		// navruz + eid al fitr — 21..23 Mar
		"2026-03-21", // Sat
		"2026-03-22", // Sun
		"2026-03-23", // Mon
		// memorial day (9 may) — 9..11 May
		"2026-05-09", // Sat
		"2026-05-10", // Sun
		"2026-05-11", // Mon
		// eid al adha — 28..31 May (29 May is Friday)
		"2026-05-27", // Wed
		"2026-05-28", // Thu
		"2026-05-30", // Sat
		// independence day
		"2026-09-01", // Tue
		// new year — 31 Dec 2026 .. 3 Jan 2027 (01 Jan is Friday)
		"2026-12-31", // Thu
		"2027-01-01", // Fri
		"2027-01-02", // Sat
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
