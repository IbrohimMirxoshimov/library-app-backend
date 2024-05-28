import { Provider } from "@nestjs/common";
import { CreateLocationUsecaseImpl } from "app/application/usecases/locations";
import { Tokens } from "app/common";
import { LocationService, RegionService } from "app/domain";

export const LocationUsecasesProvider: Provider[] = [
  {
    provide: Tokens.Usecase.Locations.Create,
    useFactory: (locationService: LocationService, regionService: RegionService) => {
      return new CreateLocationUsecaseImpl(locationService, regionService)
    },
    inject: [
      Tokens.Domain.Locations.Service,
      Tokens.Domain.Regions.Service,
    ],
  },
];
