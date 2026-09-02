import { Test, TestingModule } from '@nestjs/testing';
import { SupabaseService } from '../supabase.service';
import { ConfigService } from '@nestjs/config';

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    from: jest.fn(),
    auth: {},
  }),
}));

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
          SUPABASE_ANON_KEY: 'anon-key',
        };
        return config[key];
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize with valid config', () => {
      expect(() => service.onModuleInit()).not.toThrow();
    });

    it('should throw error when SUPABASE_URL is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_URL') return undefined;
        return 'some-value';
      });

      expect(() => service.onModuleInit()).toThrow('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') return undefined;
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        return 'some-value';
      });

      expect(() => service.onModuleInit()).toThrow('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    });
  });

  describe('getClient', () => {
    it('should return the Supabase client', () => {
      service.onModuleInit();
      const client = service.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('getAuthClient', () => {
    it('should return the auth client when anon key is provided', () => {
      service.onModuleInit();
      const client = service.getAuthClient();
      expect(client).toBeDefined();
    });
  });
});
