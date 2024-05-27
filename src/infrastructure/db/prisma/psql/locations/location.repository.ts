import { Injectable } from "@nestjs/common";
import { IdResponse, Location, LocationModule, LocationRepository } from "app/domain";
import { PrismaService } from "../..";

@Injectable()
export class LocationRepositoryImpl implements LocationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  create(data: Location): Promise<IdResponse> {
    throw new Error("Method not implemented.");
  }
  findByParam(param: Partial<LocationModule>): Promise<LocationModule> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<LocationModule[] | []> {
    throw new Error("Method not implemented.");
  }
  
}