const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");

const Collection = sequelize.define(
	"collection",
	{
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		sort: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = Collection;
