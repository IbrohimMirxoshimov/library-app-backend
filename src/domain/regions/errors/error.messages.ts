import { Language, MultiLanguage } from "app/domain";
import { RegionErrorCodes } from "./error.codes";

export const RegionErrorMessages: Record<RegionErrorCodes, MultiLanguage> = {
  [RegionErrorCodes.AlreadyExists]: {
    [Language.English]: '',
    [Language.Russian]: '',
    [Language.Uzbek]: '',
  },
  [RegionErrorCodes.NotFound]: {
    [Language.English]: '',
    [Language.Russian]: '',
    [Language.Uzbek]: '',
  }
}