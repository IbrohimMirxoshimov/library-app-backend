import { User } from "app/domain/users/users";
import { UseCase } from "../baseUsecase.type";
import { UsersRepository } from "app/domain/users/repositories/users.repository";

export interface UpdateUserUsecase extends UseCase<User, User> {}

export class UpdateUserUsecaseImpl implements UpdateUserUsecase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(user: User): Promise<User> {
        return this.usersRepository.update(user);
    }
}
