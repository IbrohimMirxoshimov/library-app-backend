import { UseCase } from "../baseUsecase.type";
import { UserCreate, UserModel } from "app/domain/users/services/users.types";
import { UserService } from "app/domain/users/services/user-service";
import { AlreadyExistsException, NotFoundException } from "app/common";
import { UserErrorMessages } from "app/domain/users/errors/error.messages";
import { UserErrorCodes } from "app/domain/users/errors/error-codes";
import { LocationErrorCodes, LocationErrorMessages, LocationService } from "app/domain";

export interface CreateUserUseCase extends UseCase<UserCreate, UserModel> {}

export class CreateUserUseCaseImpl implements CreateUserUseCase {
    constructor(
        private readonly userService: UserService,
        private readonly locationService: LocationService,
    ) {}

    public async execute(input: UserCreate): Promise<UserModel> {
        const findUser = await this.userService.findByParam({ first_name: input.first_name });
        
        if (findUser) {
            throw new AlreadyExistsException(
                UserErrorMessages[UserErrorCodes.AlreadyExists], 
                UserErrorCodes.AlreadyExists,
            )
        }

        const location = await this.locationService.findByParam({id: input.location_id});

        if (!location) {
            throw new NotFoundException(
                LocationErrorMessages[LocationErrorCodes.NotFound], 
                LocationErrorCodes.NotFound,
                {
                    location_id: input.location_id,
                }
            )
        }

        return this.userService.createUser(input);
    }
}
