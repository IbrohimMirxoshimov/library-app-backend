const { production } = require("../config");

const session = {};

function isLive(expTime) {
	return Date.now() < expTime;
}

function setSession(token, data) {
	session[token] = data;
}

function getSession(token) {
	let t = session[token];
	return t && isLive(t.expireTime) && t;
}

// mock session for developing
if (!production) {
	let User = require("../database/models/User");
	User.findOne({ where: { username: "admin_app" } }).then((user) => {
		let a = user.toJSON();
		delete a.password;
		delete a.tempLocationId;
		delete a.deletedAt;

		session.dev_token = {
			expireTime: Date.now() * 2,
			...a,
		};
	});
}

module.exports = {
	getSession: getSession,
	setSession: setSession,
};
