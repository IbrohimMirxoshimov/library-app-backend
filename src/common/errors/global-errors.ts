import { MultiLanguage } from "app/domain/common/multi-language";
import { CustomError } from "./custom-exception";

export class NotFoundException extends CustomError {
  constructor(message: MultiLanguage, error_code: number, data?: Record<string, unknown>) {
    super({
      error_code,
      getMessage: message,
      statusCode: 404,
      data
    });
  }
}

export class AlreadyExistsException extends CustomError {
  constructor(message: MultiLanguage, error_code: number, data?: Record<string, unknown>) {
    super({
      error_code,
      getMessage: message,
      statusCode: 409,
      data
    });
  }
}