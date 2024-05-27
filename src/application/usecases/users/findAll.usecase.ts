import { Id } from "app/domain/common/id.types";
import { UseCase } from "../baseUsecase.type";
import { UserService } from "app/domain/users/services/user-service";
import { UserModel } from "app/domain/users/services/users.types";

export interface FindAllUserUsecase extends UseCase<Id, UserModel[]> {}

export class FindAllUserUsecaseImpl implements FindAllUserUsecase {
    constructor(private readonly userService: UserService) {}

    public async execute(id: Id): Promise<UserModel[]> {
        return this.userService.findAllUsers();
    }
}
