import { Language, MultiLanguage } from "app/domain/common/multi-language";
import { UserErrorCodes } from "./error-codes";

export const UserErrorMessages: Record<UserErrorCodes, MultiLanguage> = {
  [UserErrorCodes.AlreadyExists]: {
    [Language.English]: 'user already exists',
    [Language.Russian]: '',
    [Language.Uzbek]: 'Foydalanuvchi mavjud',
  },
  [UserErrorCodes.NotFound]: {
    [Language.English]: 'User topilmadi',
    [Language.Russian]: '',
    [Language.Uzbek]: 'Foydalanuvchi topilmadi',
  }
}
