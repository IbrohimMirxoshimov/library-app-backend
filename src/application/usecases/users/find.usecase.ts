import { Id } from "app/domain/common/id.types";
import { User } from "app/domain/users/users";
import { UseCase } from "../baseUsecase.type";
import { UsersRepository } from "app/domain/users/repositories/users.repository";

export interface FindUserUseCase extends UseCase<Id, User> {}

export class FindUserUseCaseImpl implements FindUserUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(input: Id): Promise<User> {
        return this.usersRepository.findOne(input);
    }
}
