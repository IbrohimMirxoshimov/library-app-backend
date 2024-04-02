const getOne = require("./getOne");

const edit = (Model) => async (req, res, next) => {
	try {
		delete req.body.owner;

		let result = await Model.update(req.body, { where: { id: req.params.id } });

		if (!result[0]) return res.json({ message: "Not found" }).status(404);

		return getOne(Model)(req, res, next);
		// return res.json({ message: "Updated" }).status(200);
	} catch (e) {
		next(e);
	}
};

module.exports = edit;
