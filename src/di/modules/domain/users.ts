import { Module } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepository } from "app/domain/users";
import { UserServiceImpl } from "app/domain/users/services/user-service";
import { UsersRepositoryImpl } from "app/infrastructure/db/prisma/psql/users/users.repository";

@Module({
  imports: [],
  providers: [
    {
      provide: Tokens.Domain.Users.Repository,
      useClass: UsersRepositoryImpl
    },
    {
      provide: Tokens.Domain.Users.Service,
      useFactory: (userRepository: UsersRepository) => {
        return new UserServiceImpl(userRepository)
      },
      inject: [Tokens.Domain.Users.Repository]
    }
  ],
  exports: [
    Tokens.Domain.Users.Repository,
    Tokens.Domain.Users.Service
  ],
})
export class UserModule {}