import { Provider } from "@nestjs/common";
import { CreateUserUseCaseImpl, FindAllUserUsecaseImpl, FindUserUseCaseImpl } from "app/application/usecases/users";
import { Tokens } from "app/common/token";
import { LocationService } from "app/domain";
import { UserService, UsersRepository } from "app/domain/users";

export const UserUsecasesProvider: Provider[] = [
  {
    provide: Tokens.Usecase.Users.Create,
    useFactory: (userService: UserService, locationService: LocationService) => {
      return new CreateUserUseCaseImpl(userService, locationService)
    },
    inject: [
      Tokens.Domain.Users.Service,
      Tokens.Domain.Locations.Service,
    ]
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