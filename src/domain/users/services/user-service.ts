import { UsersRepository } from "../repositories/users.repository";
import { User } from "../users";

export interface UserService {
  findAllUsers(): Promise<User[] | []>
}

export class UserServiceImpl implements UserService {
  constructor(private readonly userRepository: UsersRepository) {}

  async findAllUsers(): Promise<[] | User[]> {
    return this.userRepository.findAll();
  }
}