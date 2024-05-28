import { BaseEntity } from "../common/base-entity";
import { LocationModule } from "./service";

export class Location extends BaseEntity<LocationModule> {
  public get name(): string {
    return this.data.name;
  }

  public get region_id(): number {
    return this.data.region_id;
  }

  public get created_at(): Date {
    return this.data.created_at;
  }

  public get updated_at(): Date {
    return this.data.updated_at;
  }

  public set updated_at(updated_at: Date) {
    this.data.updated_at = updated_at;
  }
}
