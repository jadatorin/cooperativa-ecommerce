import { Test, TestingModule } from '@nestjs/testing';
import { DollarRateService } from '../dollar-rate.service';
import { SupabaseService } from '../../supabase/supabase.service';

describe('DollarRateService', () => {
  let service: DollarRateService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockRate = {
    id: 'rate-123',
    rate: 36.5,
    source: 'manual',
    effective_date: '2026-09-01',
    created_at: new Date().toISOString(),
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DollarRateService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<DollarRateService>(DollarRateService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCurrentRate', () => {
    it('should return current rate', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockRate,
        error: null,
      });

      const result = await service.getCurrentRate();

      expect(result).toEqual(mockRate);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_dollar_rates');
    });

    it('should return default rate on connection failure', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await service.getCurrentRate();

      expect(result.rate).toBe(1);
      expect(result.source).toBe('default');
    });
  });

  describe('updateRate', () => {
    it('should update rate successfully', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: { ...mockRate, rate: 40.0 },
        error: null,
      });

      const result = await service.updateRate(40.0, 'admin');

      expect(result.rate).toBe(40.0);
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Upsert failed' },
      });

      await expect(service.updateRate(40.0)).rejects.toThrow('Error updating rate');
    });
  });

  describe('getRateHistory', () => {
    it('should return rate history', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: [mockRate],
        error: null,
      });

      const result = await service.getRateHistory();

      expect(result).toEqual([mockRate]);
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.limit.mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
      });

      await expect(service.getRateHistory()).rejects.toThrow('Error fetching rate history');
    });
  });
});
