import { Injectable } from "@nestjs/common";
import { UsersRepository } from "app/domain/users/users.repository";
import { User } from "app/domain/users/users.types";

@Injectable()
export class UsersRepositoryImpl implements UsersRepository {
    findOne(id: number): Promise<User> {
        throw new Error("Method not implemented.");
    }
    findAll(): Promise<User[]> {
        throw new Error("Method not implemented.");
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
