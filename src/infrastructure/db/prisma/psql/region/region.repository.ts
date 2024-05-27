import { Injectable } from "@nestjs/common";
import { IdResponse, Region, RegionModule, RegionRepository } from "app/domain";
import { PrismaService } from "../..";

@Injectable()
export class RegionRepositoryImple implements RegionRepository {
  constructor(private readonly prismaService: PrismaService) {}
  create(data: Region): Promise<IdResponse> {
    throw new Error("Method not implemented.");
  }
  findByParam(param: Partial<RegionModule>): Promise<RegionModule> {
    throw new Error("Method not implemented.");
  }
  findAll(): Promise<[] | RegionModule[]> {
    throw new Error("Method not implemented.");
  }
}