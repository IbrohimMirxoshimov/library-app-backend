import { MultiLanguage } from "app/domain/common/multi-language";

export interface ICustomError {
  error_code: number;
  statusCode: number;
  getMessage: MultiLanguage;
  data?: Record<string, unknown>;
  createdAt?: Date;
}
