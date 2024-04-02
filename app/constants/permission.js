const permissions = {
	location: {
		name: "location",
		permissions: {
			UPDATE_LOCATION: "UPDATE_LOCATION",
			DELETE_LOCATION: "DELETE_LOCATION",
			CREATE_LOCATION: "CREATE_LOCATION",
			READ_LOCATION: "READ_LOCATION",
		},
	},
	stock: {
		name: "stock",
		permissions: {
			UPDATE_STOCK: "UPDATE_STOCK",
			DELETE_STOCK: "DELETE_STOCK",
			CREATE_STOCK: "CREATE_STOCK",
			READ_STOCK: "READ_STOCK",
		},
	},
	book: {
		name: "book",
		permissions: {
			UPDATE_BOOK: "UPDATE_BOOK",
			DELETE_BOOK: "DELETE_BOOK",
			CREATE_BOOK: "CREATE_BOOK",
			READ_BOOK: "READ_BOOK",
		},
	},
	booksgroups: {
		name: "booksgroups",
		permissions: {
			UPDATE_BOOKSGROUPS: "UPDATE_BOOKSGROUPS",
			DELETE_BOOKSGROUPS: "DELETE_BOOKSGROUPS",
			CREATE_BOOKSGROUPS: "CREATE_BOOKSGROUPS",
			READ_BOOKSGROUPS: "READ_BOOKSGROUPS",
		},
	},

	collection: {
		name: "collection",
		permissions: {
			UPDATE_COLLECTION: "UPDATE_COLLECTION",
			DELETE_COLLECTION: "DELETE_COLLECTION",
			CREATE_COLLECTION: "CREATE_COLLECTION",
			READ_COLLECTION: "READ_COLLECTION",
		},
	},
	user: {
		name: "user",
		permissions: {
			UPDATE_USER: "UPDATE_USER",
			DELETE_USER: "DELETE_USER",
			CREATE_USER: "CREATE_USER",
			READ_USER: "READ_USER",
		},
	},
	rent: {
		name: "rent",
		permissions: {
			UPDATE_RENT: "UPDATE_RENT",
			DELETE_RENT: "DELETE_RENT",
			CREATE_RENT: "CREATE_RENT",
			READ_RENT: "READ_RENT",
		},
	},
	region: {
		name: "region",
		permissions: {
			UPDATE_REGION: "UPDATE_REGION",
			DELETE_REGION: "DELETE_REGION",
			CREATE_REGION: "CREATE_REGION",
			READ_REGION: "READ_REGION",
		},
	},
	comment: {
		name: "comment",
		permissions: {
			UPDATE_COMMENT: "UPDATE_COMMENT",
			DELETE_COMMENT: "DELETE_COMMENT",
			CREATE_COMMENT: "CREATE_COMMENT",
			READ_COMMENT: "READ_COMMENT",
		},
	},
	publishing: {
		name: "publishing",
		permissions: {
			UPDATE_PUBLISHING: "UPDATE_PUBLISHING",
			DELETE_PUBLISHING: "DELETE_PUBLISHING",
			CREATE_PUBLISHING: "CREATE_PUBLISHING",
			READ_PUBLISHING: "READ_PUBLISHING",
		},
	},
	author: {
		name: "author",
		permissions: {
			UPDATE_AUTHOR: "UPDATE_AUTHOR",
			DELETE_AUTHOR: "DELETE_AUTHOR",
			CREATE_AUTHOR: "CREATE_AUTHOR",
			READ_AUTHOR: "READ_AUTHOR",
		},
	},
};

module.exports = permissions;
