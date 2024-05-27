
export enum Language {
  Russian = 'ru',
  English = 'en',
  Uzbek = 'uz',
}

export interface MultiLanguage {
  [Language.English]: string,
  [Language.Russian]: string;
  [Language.Uzbek]: string;
}