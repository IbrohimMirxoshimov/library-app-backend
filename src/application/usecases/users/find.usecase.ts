import { Id } from "app/domain/Id/id.types";
import { UseCase } from "../baseUsecase.type";
import { User } from "app/domain/users/users.types";
import { Inject, Injectable } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/users.repository";

export interface FindUserUseCase extends UseCase<Id, User> {}

@Injectable()
export class FindUserUseCaseImpl implements FindUserUseCase {
    constructor(
        @Inject(Tokens.Domain.Users.Repository) private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(input: Id): Promise<User> {
        return this.usersRepository.findOne(input);
    }
}
