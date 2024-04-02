const jwt = require("express-jwt");
const config = require("../../config");
// const { getSession } = require("../../helpers/session");

/**
 * We are assuming that the JWT will come in a header with the form
 *
 * Authorization: Bearer ${JWT}
 *
 * But it could come in a query parameter with the name that you want like
 * GET https://my-bulletproof-api.com/stats?apiKey=${JWT}
 * Luckily this API follow _common sense_ ergo a _good design_ and don't allow that ugly stuff
 */
const getTokenFromHeader = (req) => {
	/**
	 * @TODO Edge and Internet Explorer do some weird things with the headers
	 * So I believe that this should handle more 'edge' cases ;)
	 */
	if (
		req.headers.authorization &&
		req.headers.authorization.split(" ")[0] === "Bearer"
	) {
		return req.headers.authorization.split(" ")[1];
	}
	return null;
};

const isAuth = jwt({
	secret: config.jwtSecret, // The _secret_ to sign the JWTs
	userProperty: "user", // Use req.token to store the JWT
	getToken: getTokenFromHeader, // How to extract the JWT from the request
	algorithms: ["HS256"],
});

// const isAuth = (req, res, next) => {
// 	let user = getSession(getTokenFromHeader(req));

// 	if (user) {
// 		req.user = user;
// 		return next();
// 	}

// 	let e = new Error("Forbidden");
// 	e.status = 403
// 	e.name = "UnauthorizedError";
// 	throw e;
// };

module.exports = isAuth;
