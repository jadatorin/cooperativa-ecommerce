import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RedisModule } from './common/redis.module';
import { CacheService } from './common/cache.service';
import { MonitoringModule } from './common/monitoring.module';
import { MonitoringService } from './common/monitoring.service';
import { RequestTimingInterceptor } from './common/request-timing.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { DollarRateModule } from './modules/dollar-rate/dollar-rate.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    SupabaseModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CartModule,
    OrdersModule,
    FavoritesModule,
    DollarRateModule,
    HealthModule,
    MonitoringModule,
  ],
  providers: [
    CacheService,
    MonitoringService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestTimingInterceptor,
    },
  ],
})
export class AppModule {}
