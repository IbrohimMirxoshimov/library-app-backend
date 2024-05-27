import { UsersRepository } from "../repository/users.repository";
import { User } from "../users";
import { UserCreate, UserModel } from "./users.types";

export interface UserService {
  findAllUsers(): Promise<UserModel[] | []>;
  createUser(data: UserCreate): Promise<UserModel>;
  findByParam(param: Partial<UserModel>):  Promise<UserModel | null>;
}

export class UserServiceImpl implements UserService {
  constructor(private readonly userRepository: UsersRepository) {}

  async findAllUsers(): Promise<[] | UserModel[]> {
    return this.userRepository.findAll();
  }

  async createUser(data: UserCreate): Promise<UserModel> {
    const user = new User({
      first_name: data.first_name,
      last_name: data.last_name,
      created_at: new Date(),
      updated_at: new Date(),
      location_id: data.location_id, // static, should be change and find location id from location table
    });
    
    return this.userRepository.create(user);
  }

  async findByParam(param: Partial<UserModel>): Promise<UserModel | null> {
    return this.userRepository.findByParam(param);
  }
}