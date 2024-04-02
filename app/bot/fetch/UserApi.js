const User = require("../../database/models/User");

class UserApi {
	static add(data) {
		return User.create(data);
	}
	static findOne(options) {
		return User.findOne(options);
	}
}

module.exports = UserApi;
