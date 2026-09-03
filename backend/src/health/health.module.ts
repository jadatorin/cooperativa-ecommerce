import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { SupabaseModule } from '../modules/supabase/supabase.module';
import { CacheService } from '../common/cache.service';
import { MonitoringService } from '../common/monitoring.service';

@Module({
  imports: [SupabaseModule],
  controllers: [HealthController],
  providers: [CacheService, MonitoringService],
})
export class HealthModule {}
