import { Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { FindAllUserUsecase, FindUserUseCase } from "app/application/usecases/users";
import { Tokens } from "app/common/token";

@Controller('users')
export class UserController {
  constructor(
    @Inject(Tokens.Usecase.Users.FindAll) private readonly findAllUserUsecase: FindAllUserUsecase,
    @Inject(Tokens.Usecase.Users.Find) private readonly findUserUsecase: FindUserUseCase,
  ) {}

  @Get()
  getAllUsers() {
    return this.findAllUserUsecase.execute(1);
  }

  @Get(':id')
  createUser(@Param('id') id: string) {
    return this.findUserUsecase.execute(+id)
  }
}