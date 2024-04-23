import { UseCase } from "../baseUsecase.type";
import { Inject, Injectable } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/users.repository";
import { User, UserCreate } from "app/domain/users/users.types";

export interface CreateUserUseCase extends UseCase<UserCreate, User> {}

@Injectable()
export class CreateUserUseCaseImpl implements CreateUserUseCase {
    constructor(
        @Inject(Tokens.Domain.Users.Repository) private readonly usersRepository: UsersRepository,
    ) {}

    public async execute(input: UserCreate): Promise<User> {
        return this.usersRepository.create(input);
    }
}
