import { Provider } from "@nestjs/common";
import { CreateUserUseCaseImpl, FindAllUserUsecaseImpl, FindUserUseCaseImpl } from "app/application/usecases/users";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users/repositories/users.repository";
import { UserService } from "app/domain/users/services/user-service";

export const UserUsecasesProvider: Provider[] = [
  {
    provide: Tokens.Usecase.Users.Create,
    useFactory: (userRepository: UsersRepository) => {
      return new CreateUserUseCaseImpl(userRepository)
    },
    inject: [Tokens.Domain.Users.Repository]
  },
  {
    provide: Tokens.Usecase.Users.FindAll,
    useFactory: (userService: UserService) => {
      return new FindAllUserUsecaseImpl(userService)
    },
    inject: [Tokens.Domain.Users.Service]
  },
  {
    provide: Tokens.Usecase.Users.Find,
    useFactory: (userRepository: UsersRepository) => {
      return new FindUserUseCaseImpl(userRepository)
    },
    inject: [Tokens.Domain.Users.Repository]
  }
]