import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { SupabaseService } from '../src/modules/supabase/supabase.service';

/**
 * Creates a mock SupabaseService for e2e tests that import AppModule.
 */
export function createMockSupabaseService() {
  const mockClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation((resolve: any) =>
      resolve({ data: [], error: null, count: 0 }),
    ),
  };

  return {
    supabaseService: {
      getClient: jest.fn().mockReturnValue(mockClient),
      getAuthClient: jest.fn().mockReturnValue({
        auth: {
          signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
          signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
          refreshSession: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }),
      getClientWithAuth: jest.fn().mockReturnValue(mockClient),
    },
    mockClient,
  };
}

/**
 * Build and start a NestJS TestingModule with mocked SupabaseService.
 */
export async function createTestApp(): Promise<{
  app: INestApplication;
  supabaseMock: ReturnType<typeof createMockSupabaseService>;
}> {
  const supabaseMock = createMockSupabaseService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SupabaseService)
    .useValue(supabaseMock.supabaseService)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
  await app.init();

  return { app, supabaseMock };
}
