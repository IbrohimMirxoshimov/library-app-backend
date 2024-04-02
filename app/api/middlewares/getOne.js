const getOne = (Model) => async (req, res, next) => {
	try {
		let result = await Model.findByPk(req.params.id);

		if (!result) return res.status(404).json({ message: "Not found" });

		return res.status(200).json(result.toJSON());
	} catch (e) {
		next(e);
	}
};

module.exports = getOne;
