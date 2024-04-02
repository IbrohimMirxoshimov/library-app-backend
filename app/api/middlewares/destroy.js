const destroy = (Model) => async (req, res, next) => {
	try {
		let result = await Model.destroy({ where: { id: req.params.id } });

		if (!result[0]) return res.json({ message: "Not found" }).status(404);

		return res.json({ message: "Destroyed" }).status(200);
	} catch (e) {
		next(e);
	}
};

module.exports = destroy;
