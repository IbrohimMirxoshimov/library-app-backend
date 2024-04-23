import { Id } from "app/domain/Id/id.types";
import { UseCase } from "../baseUsecase.type";
import { Inject, Injectable } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/users.repository";

export interface DeleteUserUseCase extends UseCase<Id, boolean> {}

@Injectable()
export class DeleteUserUseCaseImpl implements DeleteUserUseCase {
    constructor(
        @Inject(Tokens.Domain.Users.Repository) private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(input: Id): Promise<boolean> {
        return this.usersRepository.delete(input);
    }
}
