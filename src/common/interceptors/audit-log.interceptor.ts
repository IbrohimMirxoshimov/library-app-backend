import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { RequestUser } from '../interfaces/request-user.interface';

/**
 * Logs all admin write operations (POST, PATCH) for audit trail.
 * Captures: userId, action, resource, resourceId, newData, ip, userAgent.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      ip: string;
      headers: Record<string, string | undefined>;
      user: RequestUser;
    }>();
    const method = request.method;

    // Only log write operations
    if (method !== 'POST' && method !== 'PATCH') {
      return next.handle();
    }

    const user = request.user;
    if (!user || user.type === 'internal') {
      return next.handle();
    }

    // Extract resource name from URL: /api/v1/books/123 → "books"
    const urlParts = request.url.split('/').filter(Boolean);
    const apiIndex = urlParts.indexOf('v1');
    const resource = apiIndex >= 0 ? urlParts[apiIndex + 1] || 'unknown' : 'unknown';
    const action = method === 'POST' ? 'CREATE' : 'UPDATE';

    return next.handle().pipe(
      tap((responseData) => {
        const resourceId =
          responseData &&
          typeof responseData === 'object' &&
          'id' in responseData
            ? (responseData as { id: number }).id
            : 0;

        this.prisma.auditLog
          .create({
            data: {
              action,
              resource,
              resourceId,
              newData: responseData ? JSON.parse(JSON.stringify(responseData)) : null,
              ip: request.ip || null,
              userAgent: request.headers['user-agent'] || null,
              userId: user.id,
            },
          })
          .catch((error: unknown) => {
            this.logger.error('Failed to create audit log', error);
          });
      }),
    );
  }
}
