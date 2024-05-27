import { Injectable } from "@nestjs/common";
import { PrismaService } from "../..";
import { UserCreate, UserModel } from "app/domain/users/services/users.types";
import { UsersRepository } from "app/domain/users/repository/users.repository";

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
    constructor(private readonly prismaService: PrismaService) { }

    async findAll(): Promise<UserModel[]> {
        const res = await this.prismaService.users.findMany();
        return res;
    }

    async findByParam(param: UserModel): Promise<UserModel> {
        const res = await this.prismaService.users.findFirst({
            where: param
        });
        return res;
    }

    async create(user: UserCreate): Promise<UserModel | null> {
        return this.prismaService.users.create({
            data: {
                first_name: user.first_name,
                last_name: user.last_name,
                location_id: user.location_id,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });
    }
    update(user: UserModel): Promise<UserModel> {
        throw new Error("Method not implemented.");
    }
    delete(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}
