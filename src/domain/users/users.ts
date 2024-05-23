import { BaseEntity } from "../common/base-entity";
import { UserModel } from "./services/users.types";

export class User extends BaseEntity<UserModel> implements UserModel {
  public get id() {
    return this.data.id;
  }

  public get firstname() {
    return this.data.firstname;
  }
  public get lastname() {
    return this.data.firstname;
  }
  public get locationId() {
    return this.data.firstname;
  }
  public get createdAt() {
    return this.data.firstname;
  }
  public get updatedAt() {
    return this.data.firstname;
  }
}