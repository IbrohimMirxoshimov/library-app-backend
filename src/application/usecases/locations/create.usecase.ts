import { 
  CreateLocation, 
  IdResponse, 
  LocationErrorCodes, 
  LocationErrorMessages, 
  LocationService, 
  RegionErrorCodes, 
  RegionErrorMessages, 
  RegionService 
} from "app/domain";
import { UseCase } from "../baseUsecase.type";
import { AlreadyExistsException, NotFoundException } from "app/common";

export interface CreateLocationUsecase extends UseCase<CreateLocation, IdResponse> {}

export class CreateLocationUsecaseImpl implements CreateLocationUsecase {
  constructor(
    private readonly locationService: LocationService,
    private readonly regionService: RegionService,
  ) {}

  async execute(input: CreateLocation): Promise<IdResponse> {
    const location = await this.locationService.findByParam({name: input.name});

    if (location) {
      throw new AlreadyExistsException(
        LocationErrorMessages[LocationErrorCodes.AlreadyExists],
        LocationErrorCodes.AlreadyExists,
      )
    }

    const region = await this.regionService.findByParam({ id: location.region_id });

    if (!region) {
      throw new NotFoundException(
        RegionErrorMessages[RegionErrorCodes.NotFound],
        RegionErrorCodes.NotFound,
      )
    }

    return this.locationService.create(input);
  }
}