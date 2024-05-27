import { UsersRepository } from "app/domain/users";
import { UseCase } from "../baseUsecase.type";
import { UserModel } from "app/domain/users/services/users.types";

export interface FindUserUseCase extends UseCase<Partial<UserModel>, UserModel> {}

export class FindUserUseCaseImpl implements FindUserUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) {}
    public async execute(input: Partial<UserModel>): Promise<UserModel> {
        return this.usersRepository.findByParam(input);
    }
}
