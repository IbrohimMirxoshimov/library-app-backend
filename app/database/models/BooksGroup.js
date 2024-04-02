const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const BooksGroup = sequelize.define(
	"booksGroups",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		description: {
			type: DataTypes.TEXT,
		},
		image: {
			type: DataTypes.STRING,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = BooksGroup;
