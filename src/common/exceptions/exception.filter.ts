import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { CustomError } from "../errors/custom-exception";
import { BaseExceptionFilter } from "@nestjs/core";
import { Language } from "app/domain/common/multi-language";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Catch(Error)
export class GlobalExceptionFilter extends BaseExceptionFilter implements ExceptionFilter {
  constructor() {
    super();
  }
  public override async catch(exception: Error, host: ArgumentsHost) {
    const { headers } = host.switchToRpc().getData<{ headers: { 'x-accept-language': string } }>();
    
    const language: Language = headers['x-accept-language'] ? headers['x-accept-language'] as Language : Language.English;

    const response = host.switchToHttp().getResponse();
    if (exception instanceof CustomError) {

      const responseBody = {
        error_code: exception.error_code,
        statusCode: exception.statusCode,
        message: exception.getMessage[language],
        data: exception.data,
        createdAt: exception.createdAt,
      }

      return response.status(exception.statusCode).json(responseBody);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      const responseBody = {
        message: 'Something happened on the server',
        statusCode: 500,
        error_code: exception.code,
        data: exception.meta,
        createdAt: new Date(),
      }
      return response.json(responseBody);
    }

  }
}