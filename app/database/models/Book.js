const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Book = sequelize.define(
	"books",
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
		isbn: {
			type: DataTypes.STRING,
		},
		language: {
			type: DataTypes.STRING,
			defaultValue: "uz",
		},
		rentDuration: {
			type: DataTypes.INTEGER,
			defaultValue: 15,
		},
		price: {
			type: DataTypes.INTEGER,
			defaultValue: 50000,
		},
		printedAt: {
			type: DataTypes.DATE,
		},
		pages: {
			type: DataTypes.INTEGER,
		},
		sort: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		few: {
			type: DataTypes.INTEGER,
			defaultValue: 2,
		},
	},
	{
		paranoid: true,
		indexes: [
			{
				name: "idx_books_name",
				fields: ["name"],
			},
			{
				name: "idx_books_name_lower",
				fields: [sequelize.fn("LOWER", sequelize.col("name"))],
			},
			{
				name: "idx_books_author_id",
				fields: ["authorId"],
			},
		],
	}
);

module.exports = Book;
