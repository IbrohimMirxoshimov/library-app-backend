import { Injectable } from "@nestjs/common";
import { IdResponse, Location, LocationModule, LocationRepository } from "app/domain";
import { PrismaService } from "../..";

@Injectable()
export class LocationRepositoryImpl implements LocationRepository {
  constructor(private readonly prismaService: PrismaService) { }

  async create(input: Location): Promise<IdResponse> {
    const { name, created_at, region_id, updated_at} = input;
    const res = await this.prismaService.locations.create({
      data: {
        name,
        region_id,
        created_at,
        updated_at,
      }
    });
    return { id: res.id };
  }
  async findByParam(param: Partial<LocationModule>): Promise<LocationModule> {
    return this.prismaService.locations.findFirst({
      where: param,
    });
  }
  findAll(): Promise<LocationModule[] | []> {
    return this.prismaService.locations.findMany();
  }

}