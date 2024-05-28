import { Language, MultiLanguage } from "app/domain";
import { LocationErrorCodes } from "./error.codes";

export const LocationErrorMessages: Record<LocationErrorCodes, MultiLanguage> = {
  [LocationErrorCodes.AlreadyExists]: {
    [Language.English]: 'location already exists',
    [Language.Russian]: '',
    [Language.Uzbek]: 'lokatsiya mavjud',
  },
  [LocationErrorCodes.NotFound]: {
    [Language.English]: 'location not found',
    [Language.Russian]: '',
    [Language.Uzbek]: 'lokatsiya topilmdi',
  }
}