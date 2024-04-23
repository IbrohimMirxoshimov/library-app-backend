import { Global, Module } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepositoryImpl } from "./prisma/psql/users/users.repository";

@Global()
@Module({
    imports: [],
    providers: [{ provide: Tokens.Domain.Users.Repository, useClass: UsersRepositoryImpl }],
    exports: [Tokens.Domain.Users.Repository],
})
export class DbModule {}
