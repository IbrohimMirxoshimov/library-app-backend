import { Global, Module } from "@nestjs/common";
import { Tokens } from "app/common/token";
import { UsersRepositoryImpl } from "./prisma/psql/users/users.repository";
import { PrismaService } from "./prisma";

@Global()
@Module({
    imports: [],
    providers: [
        PrismaService,
        { provide: Tokens.Domain.Users.Repository, useClass: UsersRepositoryImpl },
    ],
    exports: [
        PrismaService,
        Tokens.Domain.Users.Repository,
    ],
})
export class DbModule {}
