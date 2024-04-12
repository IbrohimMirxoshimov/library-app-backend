exports.BadRequestExaption = class BadRequestExaption extends Error {
	constructor(name = "Bad request") {
		super();
		this.message = name;
		this.name = name;
	}

	status = 400;
};
