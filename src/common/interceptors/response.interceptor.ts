import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class SuccessResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<{
    message: string,
    data: unknown,
    createdAt: Date,
  }> {
    
    return next.handle().pipe(
      map((data) => {
        return {
          message: 'This is api successfully completed',
          data,
          createdAt: new Date(),
        }
      })
    )
  }  
}