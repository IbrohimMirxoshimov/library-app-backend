const { Scenes } = require("telegraf");
const { getSceneInstences } = require("../scenes");
const { Stage } = Scenes;
const stage = new Stage(getSceneInstences());

const stageMiddleware = () => stage.middleware();

module.exports = stageMiddleware;
