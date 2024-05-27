import { MultiLanguage } from "app/domain/common/multi-language";
import { ICustomError } from "../interface";

export class CustomError extends Error implements ICustomError {
  private readonly _error_code: number;
  private readonly _statusCode: number;
  private readonly _getMessage: MultiLanguage;
  private readonly _data: Record<string, unknown>;
  private readonly _createdAt: Date;

  constructor(data: ICustomError) {
    super();

    this._error_code = data.error_code;
    this._statusCode = data.statusCode;
    this._getMessage = data.getMessage;
    this._data = data.data;
    this._createdAt = new Date();
  }

  public get error_code(): number {
    return this._error_code;
  }

  public get statusCode(): number {
    return this._statusCode;
  }

  public get getMessage(): MultiLanguage {
    return this._getMessage;
  }

  public get data(): Record<string, unknown> {
    return this._data;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }
}