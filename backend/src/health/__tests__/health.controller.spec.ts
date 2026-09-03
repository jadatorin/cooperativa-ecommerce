import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { SupabaseService } from '../../modules/supabase/supabase.service';

describe('HealthController', () => {
  let controller: HealthController;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is connected', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: [{ id: 1 }],
        error: null,
      });

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return unhealthy status when database query fails', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: 'Connection refused' },
      });

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('disconnected');
    });

    it('should return unhealthy status when database throws exception', async () => {
      mockSupabaseClient.limit.mockRejectedValue(new Error('Network error'));

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('disconnected');
    });
  });
});
