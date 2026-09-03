import { Module, NestModule, MiddlewareConsumer, Injectable, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from './monitoring.service';

@Injectable()
export class RequestMetricsMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.monitoringService.recordRequest({
        method,
        path: originalUrl,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      });

      if (duration > 500) {
        Logger.warn(
          `Slow request: ${method} ${originalUrl} took ${duration}ms`,
          'MonitoringMiddleware',
        );
      }
    });

    next();
  }
}

@Module({
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestMetricsMiddleware).forRoutes('*');
  }
}
