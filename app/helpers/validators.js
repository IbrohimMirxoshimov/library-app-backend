const { Joi } = require("celebrate");
const regexNineNumber = /^\d{9}$/;

const JoiSchemes = {
	phoneNine: Joi.string().length(9).regex(regexNineNumber),
};

module.exports = {
	regexNineNumber: regexNineNumber,
	JoiSchemes: JoiSchemes,
};
