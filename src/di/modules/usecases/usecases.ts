import { Provider } from "@nestjs/common";
import { UserUsecasesProvider } from "./user.usecases";

export const UsecasesProvider: Provider[] = [
  ...UserUsecasesProvider,
];
