import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        const res = context.switchToHttp().getResponse();

        res.setHeader('X-Response-Time', `${duration}ms`);

        if (duration > 500) {
          Logger.warn(
            `Slow request: ${method} ${originalUrl} took ${duration}ms`,
            'RequestTiming',
          );
        }
      }),
    );
  }
}
