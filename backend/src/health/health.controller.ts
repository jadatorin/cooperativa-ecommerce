import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseService } from '../modules/supabase/supabase.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    let database: 'connected' | 'disconnected' = 'disconnected';

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

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
    };
  }
}
