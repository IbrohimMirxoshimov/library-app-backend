import { Language, MultiLanguage } from "app/domain";
import { LocationErrorCodes } from "./error.codes";

export const LocationErrorMessages: Record<LocationErrorCodes, MultiLanguage> = {
  [LocationErrorCodes.AlreadyExists]: {
    [Language.English]: '',
    [Language.Russian]: '',
    [Language.Uzbek]: '',
  },
  [LocationErrorCodes.NotFound]: {
    [Language.English]: '',
    [Language.Russian]: '',
    [Language.Uzbek]: '',
  }
}