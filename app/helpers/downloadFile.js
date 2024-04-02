const { default: axios } = require("axios");
const fs = require("fs");

module.exports = function downloadFile(url, path) {
	return new Promise(async (resolve, reject) => {
		const writer = fs.createWriteStream(path);
		const response = await axios({
			url,
			method: "GET",
			responseType: "stream",
		});

		response.data.pipe(writer);

		writer.on("finish", resolve);
		writer.on("error", reject);
	});
};
