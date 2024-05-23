import { UsersRepository } from "app/domain/users/repositories/users.repository";
import { UseCase } from "../baseUsecase.type";
import { UserCreate } from "app/domain/users/services/users.types";
import { User } from "app/domain/users/users";

export interface CreateUserUseCase extends UseCase<UserCreate, User> {}

export class CreateUserUseCaseImpl implements CreateUserUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}

    public async execute(input: UserCreate): Promise<User> {
        return this.usersRepository.create(input);
    }
}
