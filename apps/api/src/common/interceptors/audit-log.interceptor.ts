import { Injectable, type NestInterceptor, type ExecutionContext, type CallHandler } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { prisma } from '@openpos/database';
import type { JwtPayload } from '../../modules/auth/types';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload | undefined = request.user as JwtPayload | undefined;
    const method = request.method as string;
    const url = request.url as string;

    if (method === 'GET') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        if (!user) return;
        const entity = this.extractEntity(url);
        const action = this.getMethodAction(method);

        if (!entity) return;

        const ipAddress: string | null = (request.ip as string | undefined) ?? (request.socket?.remoteAddress as string | undefined) ?? null;

        prisma.auditLog
          .create({
            data: {
              userId: user.sub,
              deviceId: null,
              ipAddress,
              action,
              entity,
              entityId: request.params?.['id'] ?? null,
              result: 'SUCCESS',
            },
          })
          .catch(() => {});
      }),
    );
  }

  private extractEntity(url: string): string | null {
    const parts = url.split('/').filter(Boolean);
    const apiIndex = parts.indexOf('v1');
    if (apiIndex >= 0 && parts[apiIndex + 1]) {
      return parts[apiIndex + 1] as string;
    }
    return null;
  }

  private getMethodAction(method: string): string {
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PATCH': case 'PUT': return 'UPDATE';
      case 'DELETE': return 'DELETE';
      default: return 'READ';
    }
  }
}
