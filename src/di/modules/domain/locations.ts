import { Module } from "@nestjs/common";
import { Tokens } from "app/common";
import { LocationRepository, LocationServiceImpl } from "app/domain";
import { LocationRepositoryImpl } from "app/infrastructure/db/prisma/psql/locations/location.repository";

@Module({
  providers: [
    {
      provide: Tokens.Domain.Locations.Repository,
      useClass: LocationRepositoryImpl,
    },
    {
      provide: Tokens.Domain.Locations.Service,
      useFactory: (locationRepository: LocationRepository) => {
        return new LocationServiceImpl(locationRepository);
      },
      inject: [Tokens.Domain.Locations.Repository]
    },
  ],
  exports: [
    Tokens.Domain.Locations.Service,
    Tokens.Domain.Locations.Repository,
  ]
})
export class LocationsModule {}