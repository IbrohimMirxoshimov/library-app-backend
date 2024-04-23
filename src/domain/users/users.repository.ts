import { Id } from "../Id/id.types";
import { User, UserCreate } from "./users.types";

export interface UsersRepository {
    findOne(id: Id): Promise<User>;
    findAll(): Promise<User[]>;
    create(user: UserCreate): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: Id): Promise<boolean>;
}
