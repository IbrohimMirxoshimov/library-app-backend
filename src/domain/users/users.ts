import { BaseEntity } from "../common/base-entity";
import { UserModel } from "./services/users.types";

export class User extends BaseEntity<UserModel> {
  public get first_name(): string {
    return this.data.first_name;
  };
  public get last_name(): string {
    return this.data.last_name;
  };
  public get location_id(): number {
    return this.data.location_id;
  };
  public get created_at(): Date {
    return this.data.created_at;
  };
  public get updated_at(): Date {
    return this.data.updated_at;
  };
  
  public set updated_at(updated_at: Date) {
    this.data.updated_at = updated_at;
  }
}