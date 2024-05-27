import { Provider } from "@nestjs/common";
import { Tokens } from "app/common";

export const LocationUsecasesProvider: Provider[] = [
  {
    provide: Tokens.Usecase.Locations.Create,
    useFactory: () => {
      // return new 
    },
    inject: [],
  }
]