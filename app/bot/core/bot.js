const { Telegraf } = require("telegraf");
const { TOKEN } = require("../../config");
const bot = new Telegraf(TOKEN);

module.exports = bot;
