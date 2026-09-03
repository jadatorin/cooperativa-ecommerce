import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseService } from '../modules/supabase/supabase.service';
import { CacheService } from '../common/cache.service';
import { MonitoringService } from '../common/monitoring.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly cacheService: CacheService,
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    let database: 'connected' | 'disconnected' = 'disconnected';
    let cache: 'connected' | 'disconnected' = 'disconnected';

    try {
      const supabase = this.supabaseService.getClient();
      const { error } = await supabase
        .from('app_categories')
        .select('id')
        .limit(1);

      database = error ? 'disconnected' : 'connected';
    } catch {
      database = 'disconnected';
    }

    try {
      cache = await this.cacheService.ping();
    } catch {
      cache = 'disconnected';
    }

    const metrics = this.monitoringService.getMetrics();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
      cache,
      metrics: {
        avgResponseTime: metrics.avgResponseTime,
        errorRate: metrics.errorRate,
        totalRequests: metrics.totalRequests,
      },
    };
  }
}
