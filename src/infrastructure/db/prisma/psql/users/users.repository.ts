import { Injectable } from "@nestjs/common";
import { PrismaService } from "../..";
import { UsersRepository } from "app/domain/users/repositories/users.repository";
import { User } from "app/domain/users/users";

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
    constructor(private readonly prismaService: PrismaService) {}

    findOne(id: number): Promise<User> {
        throw new Error("Method not implemented.");
    }

    async findAll(): Promise<any[]> {
        const res = await this.prismaService.users.findMany();
        return res;
    }

    create(user: User): Promise<User> {
        throw new Error("Method not implemented.");
    }
    update(user: User): Promise<User> {
        throw new Error("Method not implemented.");
    }
    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
