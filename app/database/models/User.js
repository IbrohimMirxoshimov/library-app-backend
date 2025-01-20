const sequelize = require("./sequelize");
const { DataTypes } = require("sequelize");
const UserStatus = require("../../constants/UserStatus");

const User = sequelize.define(
	"users",
	{
		firstName: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		lastName: {
			type: DataTypes.STRING,
		},
		fullName: {
			type: DataTypes.STRING,
			set(val) {
				this.setDataValue(
					"fullName",
					this.firstName + " " + this.lastName
				);
			},
		},
		username: {
			type: DataTypes.STRING,
			// validate: {
			// 	len: [4, 32],
			// },
			unique: true,
		},
		phone: {
			type: DataTypes.STRING,
			// validate: {
			// 	len: {
			// 		msg: "Raqam noto'g'ri",
			// 		args: [9, 9],
			// 	},
			// },
		},
		extraPhone: {
			type: DataTypes.STRING,
			// validate: {
			// 	len: {
			// 		msg: "Raqam noto'g'ri",
			// 		args: [9, 9],
			// 	},
			// },
		},
		blockingReason: {
			type: DataTypes.TEXT,
		},
		extra: {
			type: DataTypes.TEXT,
		},
		password: {
			type: DataTypes.STRING,
			validate: {
				len: [4, 32],
			},
		},
		gender: {
			type: DataTypes.STRING,
			validate: {
				isIn: [["male", "female"]],
			},
		},
		birthDate: {
			type: DataTypes.DATE,
			validate: {
				isDate: true,
				isBefore: {
					msg: "5 yoshdan kichik bo'lmasligi kerak",
					args: new Date(new Date().getFullYear() - 5, 0, 1)
						.toISOString()
						.slice(0, 10),
				},
			},
		},
		owner: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		moderator: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		librarian: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		verified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		status: {
			type: DataTypes.INTEGER,
			defaultValue: UserStatus.active,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
		},
		phoneVerified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		telegramId: {
			type: DataTypes.STRING,
		},
		passportId: {
			type: DataTypes.STRING,
			unique: true,
		},
		passportImage: {
			type: DataTypes.STRING,
		},
		tempLocationId: {
			type: DataTypes.INTEGER,
		},
		pinfl: {
			type: DataTypes.STRING,
			unique: true,
		},
	},
	{
		paranoid: true,
	}
);

module.exports = User;
