const db = require("./models");

async function main() {
	let tag = process.argv[2] || "sync";
	switch (tag) {
		case "drop":
			await db.sequelize.drop();
			break;
		case "force":
			await db.sequelize.sync({
				force: true,
			});

			break;
		case "alter":
			await db.sequelize
				.sync({
					alter: true,
				})
				.catch((err) => {
					console.error(err);
				});
			break;
		// case "seed":
		// 	require("./seed")();
		// 	break;
		case "sql":
			require("./sql")();
			break;
		case "seed":
			await db.sequelize.sync();
			await db.Region.upsert({
				id: 1, name: "tashkent"
			})
			await db.Location.upsert({
				id: 1, name: "tashkent", phone: "97766063"
			})
			await db.User.upsert({
				firstName: "Admin",
				username: "admin_app",
				password: "pw112233",
				owner: true,
				phone: "977666063",
				moderator: true,
				librarian: true,
				locationId: 1,
				regionId: 1,
			});
			break;
		default:
			await db.sequelize.sync();
			break;
	}
	console.log("Database - " + tag);
}

main();
