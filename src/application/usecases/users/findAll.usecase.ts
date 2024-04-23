import { User } from "app/domain/users/users.types";
import { UseCase } from "../baseUsecase.type";
import { Id } from "app/domain/Id/id.types";
import { Inject, Injectable } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/users.repository";

export interface FindAllUserUsecase extends UseCase<Id, User[]> {}

@Injectable()
export class FindAllUserUsecaseImpl implements FindAllUserUsecase {
    constructor(
        @Inject(Tokens.Domain.Users.Repository) private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(id: Id): Promise<User[]> {
        return this.usersRepository.findAll();
    }
}
