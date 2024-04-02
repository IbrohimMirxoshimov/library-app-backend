// Convert Javascript date to Pg YYYY MM DD HH MI SS

function pgFormatDate(date) {
	return (
		"'" + date.toISOString().replace("T", " ").replace("Z", "") + " +00:00'"
	);
}

module.exports = {
	pgFormatDate: pgFormatDate,
};
