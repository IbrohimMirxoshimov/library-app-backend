import { Id } from "app/domain/common/id.types";
import { User } from "app/domain/users/users";
import { UseCase } from "../baseUsecase.type";
import { UsersRepository } from "app/domain/users/repositories/users.repository";
import { UserService } from "app/domain/users/services/user-service";

export interface FindAllUserUsecase extends UseCase<Id, User[]> {}

export class FindAllUserUsecaseImpl implements FindAllUserUsecase {
    constructor(private readonly userService: UserService) {}

    public async execute(id: Id): Promise<User[]> {
        return this.userService.findAllUsers();
    }
}
