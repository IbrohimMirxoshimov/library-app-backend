import { User } from "app/domain/users/users.types";
import { UseCase } from "../baseUsecase.type";
import { Inject, Injectable } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/users.repository";

export interface UpdateUserUsecase extends UseCase<User, User> {}

@Injectable()
export class UpdateUserUsecaseImpl implements UpdateUserUsecase {
    constructor(
        @Inject(Tokens.Domain.Users.Repository) private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(user: User): Promise<User> {
        return this.usersRepository.update(user);
    }
}
