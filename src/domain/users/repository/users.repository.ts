import { Id } from "app/domain/common/id.types";
import { UserCreate, UserModel } from "../services/users.types";

export interface UsersRepository {
    findAll(): Promise<UserModel[]>;
    create(user: UserCreate): Promise<UserModel | null>;
    update(user: UserModel): Promise<UserModel | null>;
    delete(id: Id): Promise<boolean | null>;
    /**
     * 
     * @param param Find one user any param
     */
    findByParam(param: Partial<UserModel>): Promise<UserModel | null>;
}
