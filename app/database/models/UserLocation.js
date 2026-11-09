const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");
const UserStatus = require("../../constants/UserStatus");

// kitobxon qaysi kutubxonalarga ulangan. users.locationId - asosiy (birinchi) kutubxona.
// blok, balans, izoh va ishonchlilik har bir kutubxonada alohida
const UserLocation = sequelize.define(
	"user_locations",
	{
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		locationId: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		status: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: UserStatus.active,
		},
		blockingReason: {
			type: DataTypes.TEXT,
		},
		balance: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		extra: {
			type: DataTypes.TEXT,
		},
		verified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
	},
	{
		updatedAt: false,
		indexes: [{ unique: true, fields: ["userId", "locationId"] }],
	}
);

module.exports = UserLocation;
