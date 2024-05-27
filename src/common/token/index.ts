export const Tokens = {
    Usecase: {
        Users: {
            Find: Symbol.for("FindUserUsecase"),
            FindAll: Symbol.for("FindAllUserUsecase"),
            Update: Symbol.for("UpdateUserUsecase"),
            Delete: Symbol.for("DeleteUserUsecase"),
            Create: Symbol.for("CreateUserUsecase"),
        },
        Locations: {
            Create: Symbol.for('Locations.create'),
            findByParam: Symbol.for('Locations.findByParam'),
            findAll: Symbol.for('Locations.findAll'),
        },
        Regions: {
            Create: Symbol.for('Regions.create'),
            findByParam: Symbol.for('Regions.findByParam'),
            findAll: Symbol.for('Regions.findAll'),
        }
    },
    Domain: {
        Users: {
            Repository: Symbol.for("UsersRepository"),
            Service: Symbol.for('UserService'),
        },
        Locations: {
            Repository: Symbol.for('Location.Repository'),
            Service: Symbol.for('Location.Service'),
        },
        Regions: {
            Repository: Symbol.for('Region.Repository'),
            Service: Symbol.for('Region.Service'),
        },
    },
    Infrastructure: {},
};
