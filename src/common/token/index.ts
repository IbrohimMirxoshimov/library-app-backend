export const Tokens = {
    Usecase: {
        Users: {
            Find: Symbol.for("FindUserUsecase"),
            FindAll: Symbol.for("FindAllUserUsecase"),
            Update: Symbol.for("UpdateUserUsecase"),
            Delete: Symbol.for("DeleteUserUsecase"),
            Create: Symbol.for("CreateUserUsecase"),
        },
    },
    Domain: {
        Users: {
            Repository: Symbol.for("UsersRepository"),
            Service: Symbol.for('UserService'),
        },
    },
    Infrastructure: {},
};
