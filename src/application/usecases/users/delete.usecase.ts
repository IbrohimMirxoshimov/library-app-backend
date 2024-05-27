import { Id } from "app/domain/common/id.types";
import { UseCase } from "../baseUsecase.type";
import { UsersRepository } from "app/domain/users";

export interface DeleteUserUseCase extends UseCase<Id, boolean> {}

export class DeleteUserUseCaseImpl implements DeleteUserUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(input: Id): Promise<boolean> {
        return this.usersRepository.delete(input);
    }
}
