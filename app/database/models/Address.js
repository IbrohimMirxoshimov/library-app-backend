const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Address = sequelize.define("address", {
	countryCode: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: "uz",
	},
	region: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	town: {
		type: DataTypes.STRING,
	},
	addressLine: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	street: {
		type: DataTypes.STRING,
	},
	home: {
		type: DataTypes.STRING,
	},
	latitude: {
		type: DataTypes.FLOAT,
	},
	longitude: {
		type: DataTypes.FLOAT,
	},
});

module.exports = Address;
