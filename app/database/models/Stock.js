const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Stock = sequelize.define(
	"stocks",
	{
		busy: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		paranoid: true,
		indexes: [
			{
				name: "idx_stocks_location_busy",
				fields: ["locationId", "busy"],
			},
			{
				name: "idx_stocks_book_id",
				fields: ["bookId"],
			},
			{
				name: "idx_stocks_location_book",
				fields: ["locationId", "bookId"],
			},
		],
	}
);

module.exports = Stock;
