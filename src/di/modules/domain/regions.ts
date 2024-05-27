import { Module } from "@nestjs/common";
import { Tokens } from "app/common";
import { RegionRepository, RegionServiceImpl } from "app/domain";
import { RegionRepositoryImple } from "app/infrastructure/db/prisma/psql/region/region.repository";

@Module({
  providers: [
    {
      provide: Tokens.Domain.Regions.Repository,
      useClass: RegionRepositoryImple,
    },
    {
      provide: Tokens.Domain.Regions.Service,
      useFactory: (regionRepository: RegionRepository) => {
        return new RegionServiceImpl(regionRepository)
      },
      inject: [Tokens.Domain.Regions.Repository]
    }
  ],
  exports: [
    Tokens.Domain.Regions.Repository,
    Tokens.Domain.Regions.Service
  ],
})
export class RegionsModule {}
