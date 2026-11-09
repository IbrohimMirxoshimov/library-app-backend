const sequelize = require("./sequelize");

const db = {};

// models
db.User = require("./User");
db.Location = require("./Location");
db.BooksGroup = require("./BooksGroup");
db.Rent = require("./Rent");
db.Collection = require("./Collection");
db.Stock = require("./Stock");
db.Region = require("./Region");
db.Town = require("./Town");
db.Publishing = require("./Publishing");
db.Author = require("./Author");
db.Book = require("./Book");
db.Address = require("./Address");
db.Comment = require("./Comment");
db.News = require("./News");
db.Sms = require("./Sms");
db.SmsBulk = require("./SmsBulk");
db.Device = require("./Device");
db.UserLocation = require("./UserLocation");

// relations
db.User.hasMany(db.Rent);
db.Rent.belongsTo(db.User);

db.Location.hasMany(db.Rent);
db.Rent.belongsTo(db.Location);

db.Town.belongsTo(db.Region);
db.Region.hasMany(db.Town);

db.User.belongsTo(db.Address);
db.Address.hasOne(db.User);

db.Region.hasMany(db.Address, { foreignKey: "regionId" });
db.Address.belongsTo(db.Region, { foreignKey: "regionId", as: "regionRef" });

db.Town.hasMany(db.Address, { foreignKey: "townId" });
db.Address.belongsTo(db.Town, { foreignKey: "townId", as: "townRef" });

db.Location.hasOne(db.Address);
db.Address.belongsTo(db.Location);

db.Region.hasMany(db.Location);
db.Location.belongsTo(db.Region);

db.Location.hasMany(db.Stock);
db.Stock.belongsTo(db.Location, {
	foreignKey: {
		allowNull: false,
	},
});

db.Location.hasMany(db.User);
db.User.belongsTo(db.Location);

db.User.hasMany(db.Sms);
db.Sms.belongsTo(db.User);

db.User.hasMany(db.SmsBulk);
db.SmsBulk.belongsTo(db.User);

db.SmsBulk.hasMany(db.Sms);
db.Sms.belongsTo(db.SmsBulk);

db.Location.hasOne(db.User, {
	foreignKey: "libraryId",
	as: "library",
});
db.User.belongsTo(db.Location, {
	foreignKey: "libraryId",
	as: "library",
});

db.Stock.hasOne(db.Rent);
db.Rent.belongsTo(db.Stock, {
	foreignKey: {
		allowNull: false,
	},
});

db.Stock.hasMany(db.Comment);
db.Comment.belongsTo(db.Stock);

db.Rent.hasMany(db.Comment);
db.Comment.belongsTo(db.Rent);

db.Book.hasMany(db.Stock);
db.Stock.belongsTo(db.Book, {
	foreignKey: {
		allowNull: false,
	},
});

db.Author.hasMany(db.Book);
db.Book.belongsTo(db.Author);

db.Collection.hasMany(db.Book);
db.Book.belongsTo(db.Collection);

db.BooksGroup.hasMany(db.Book);
db.Book.belongsTo(db.BooksGroup);

db.User.hasMany(db.Book, {
	foreignKey: "creatorId",
});
db.Book.belongsTo(db.User, {
	foreignKey: "creatorId",
});

db.User.hasMany(db.Author, {
	foreignKey: "creatorId",
});

db.Author.belongsTo(db.User, {
	foreignKey: "creatorId",
});

db.User.hasMany(db.Device);
db.Device.belongsTo(db.User);

db.Location.hasMany(db.Device);
db.Device.belongsTo(db.Location);

db.Device.hasMany(db.Sms);
db.Sms.belongsTo(db.Device);

db.User.belongsToMany(db.Location, {
	through: db.UserLocation,
	foreignKey: "userId",
	otherKey: "locationId",
	as: "libraries",
});
db.Location.belongsToMany(db.User, {
	through: db.UserLocation,
	foreignKey: "locationId",
	otherKey: "userId",
	as: "readers",
});

// kitobxon qaysi yo'l bilan yaratilmasin (dashboard, bot, ilova) yoki asosiy
// kutubxonasi o'zgarsa, o'sha kutubxonaga ulangan bo'ladi
async function linkMainLocation(user, options) {
	if (!user.locationId) return;

	await db.UserLocation.findOrCreate({
		where: { userId: user.id, locationId: user.locationId },
		transaction: options.transaction,
	});
}
db.User.afterCreate(linkMainLocation);
db.User.afterUpdate((user, options) => {
	if (user.changed("locationId")) return linkMainLocation(user, options);
});

db.sequelize = sequelize;

// console.log(db.Stock.rawAttributes);
module.exports = db;
