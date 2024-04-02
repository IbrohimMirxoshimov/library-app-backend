const http_statuses = {
	404: "Not found",
	403: "Forbidden",
	400: "Bad request",
};

function HttpError(status = 500, message, name) {
	let e = new Error(message || http_statuses[status]);
	e.status = status;
	name && (e.name = name);

	return e;
}

module.exports = HttpError;
