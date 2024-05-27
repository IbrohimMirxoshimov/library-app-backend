import { IdResponse } from "app/domain";
import { LocationRepository } from "../repository";
import { CreateLocation, LocationModule } from "./location.types";
import { Location } from "../location";

export interface LocationService {
  create(data: CreateLocation): Promise<IdResponse>;
  findByParam(param: Partial<LocationModule>): Promise<LocationModule>;
  findAll(): Promise<LocationModule[] | []>;
}

export class LocationServiceImpl implements LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}
  async create(data: CreateLocation): Promise<IdResponse> {
    const location = new Location({
      name: data.name,
      region_id: data.region_id,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.locationRepository.create(location);
  }
  async findByParam(param: Partial<LocationModule>): Promise<LocationModule> {
    return this.locationRepository.findByParam(param);
  }
  async findAll(): Promise<[] | LocationModule[]> {
    return this.locationRepository.findAll();
  }
}
