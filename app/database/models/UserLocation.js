const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

// kitobxon qaysi kutubxonalarga ulangan. users.locationId - asosiy (birinchi) kutubxona
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
	},
	{
		updatedAt: false,
		indexes: [{ unique: true, fields: ["userId", "locationId"] }],
	}
);

module.exports = UserLocation;
