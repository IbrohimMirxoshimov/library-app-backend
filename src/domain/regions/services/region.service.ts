import { IdResponse, Region, RegionRepository } from "app/domain";
import { CreateRegion, RegionModule } from "./region.types";

export interface RegionService {
  create(data: CreateRegion): Promise<IdResponse>;
  findByParam(param: Partial<RegionModule>): Promise<RegionModule>;
  findAll(): Promise<RegionModule[] | []>;
}

export class RegionServiceImpl implements RegionService {
  constructor(private readonly regionRepository: RegionRepository) {}

  async create(data: CreateRegion): Promise<IdResponse> {
    const region = new Region({
      name: data.name,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return this.regionRepository.create(region);
  }

  async findByParam(param: Partial<RegionModule>): Promise<RegionModule> {
    return this.regionRepository.findByParam(param);
  }

  async findAll(): Promise<RegionModule[] | []> {
    return this.regionRepository.findAll();
  }
}