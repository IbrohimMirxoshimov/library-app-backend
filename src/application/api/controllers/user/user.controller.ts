import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { CreateUserUseCase, FindAllUserUsecase } from "app/application/usecases/users";
import { Tokens } from "app/common/token";
import { UserCreate } from "app/domain/users/services/users.types";

@Controller('users')
export class UserController {
  constructor(
    @Inject(Tokens.Usecase.Users.FindAll) private readonly findAllUserUsecase: FindAllUserUsecase,
    @Inject(Tokens.Usecase.Users.Create) private readonly createUserUsecase: CreateUserUseCase,
  ) {}

  @Post()
  createUser(@Body() data: UserCreate) {
    return this.createUserUsecase.execute(data);
  }

  @Get()
  getAllUsers() {
    return this.findAllUserUsecase.execute(1);
  }
}