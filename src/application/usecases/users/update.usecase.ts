import { UsersRepository } from "app/domain/users";
import { UseCase } from "../baseUsecase.type";
import { UserModel } from "app/domain/users/services/users.types";

export interface UpdateUserUsecase extends UseCase<UserModel, UserModel> {}

export class UpdateUserUsecaseImpl implements UpdateUserUsecase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(user: UserModel): Promise<UserModel> {
        return this.usersRepository.update(user);
    }
}
