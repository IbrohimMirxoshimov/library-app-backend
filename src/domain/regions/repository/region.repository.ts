import { IdResponse } from "app/domain/common";
import { RegionModule } from "../services";
import { Region } from "../region";

export interface RegionRepository {
  create(data: Region): Promise<IdResponse>;
  findByParam(param: Partial<RegionModule>): Promise<RegionModule>;
  findAll(): Promise<RegionModule[] | []>;
}
