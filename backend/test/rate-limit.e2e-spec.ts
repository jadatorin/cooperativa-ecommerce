import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from '../src/health/health.module';
import { SupabaseService } from '../src/modules/supabase/supabase.service';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
        }),
      }),
      getAuthClient: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60000, limit: 5 }], // 5 requests per minute for testing
        }),
        HealthModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })
      .overrideProvider(SupabaseService)
      .useValue(mockSupabaseService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Rate limit within threshold', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
    });
  });

  describe('Rate limit exceeded', () => {
    it('should return 429 when rate limit exceeded', async () => {
      // Send requests exceeding the limit (5 per minute)
      const responses = [];
      for (let i = 0; i < 7; i++) {
        const res = await request(app.getHttpServer()).get('/api/health');
        responses.push(res);
      }

      // At least some requests should be rate limited (429)
      const rateLimited = responses.filter((r) => r.status === 429);
      const successful = responses.filter((r) => r.status === 200);

      // With limit=5 and 7 requests, at least 2 should be 429
      expect(rateLimited.length).toBeGreaterThanOrEqual(1);
      expect(successful.length).toBeLessThanOrEqual(5);

      // 429 responses should have error message
      for (const res of rateLimited) {
        expect(res.body).toHaveProperty('message');
      }
    });
  });
});
