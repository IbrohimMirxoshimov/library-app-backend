import { Id } from "app/domain/common/id.types";
import { UserCreate } from "../services/users.types";
import { User } from "../users";

export interface UsersRepository {
    findOne(id: Id): Promise<User>;
    findAll(): Promise<User[]>;
    create(user: UserCreate): Promise<User>;
    update(user: User): Promise<User>;
    delete(id: Id): Promise<boolean>;
}
