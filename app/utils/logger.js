const fs = require("fs");
const { resolve, dirname } = require("path");

const logPath = (fileName) => resolve(dirname(__dirname), "../log", fileName);

const debug = (msg) => fs.appendFileSync(logPath("logs.log"), msg + "\n");

const debugPro = (fileName, msg, jsonTrue = false) => {
	let data = jsonTrue ? JSON.stringify(msg, null, 2) : msg;
	fs.appendFileSync(logPath(fileName), data);
};
const error = (msg) => fs.appendFileSync(logPath("errors.log"), msg + "\n");

const getDateNowString = () => new Date().toLocaleString();

const dataWriter = (data, fileName, appendTrue = false) => {
	if (appendTrue) {
		fs.appendFile(
			logPath(fileName),
			getDateNowString() + "\n" + JSON.stringify(data, null, 2) + "\n",
			(err) => {
				logger(err);
			}
		);
	} else {
		fs.writeFile(logPath(fileName), JSON.stringify(data, null, 2), (err) => {
			// logger("dataWriter*" + err);
		});
	}
};

function logToAdmin(...text) {
	console.log(...text);
}

function logger(...text) {
	console.log(...text);
}

function logError(text) {
  console.error(text);
}

module.exports = {
	logger,
	logToAdmin,
	logError,
	debug,
	error,
	dataWriter,
	debugPro,
	logPath,
};
