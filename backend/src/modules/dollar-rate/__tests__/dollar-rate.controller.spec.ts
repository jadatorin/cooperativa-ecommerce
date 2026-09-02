import { Test, TestingModule } from '@nestjs/testing';
import { DollarRateController } from '../dollar-rate.controller';
import { DollarRateService } from '../dollar-rate.service';

describe('DollarRateController', () => {
  let controller: DollarRateController;
  let dollarRateService: jest.Mocked<DollarRateService>;

  const mockRate = {
    id: 'rate-123',
    rate: 36.5,
    source: 'manual',
    effective_date: '2026-09-01',
  };

  beforeEach(async () => {
    dollarRateService = {
      getCurrentRate: jest.fn(),
      updateRate: jest.fn(),
      getRateHistory: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DollarRateController],
      providers: [
        { provide: DollarRateService, useValue: dollarRateService },
      ],
    }).compile();

    controller = module.get<DollarRateController>(DollarRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrentRate', () => {
    it('should return current rate', async () => {
      dollarRateService.getCurrentRate.mockResolvedValue(mockRate);

      const result = await controller.getCurrentRate();

      expect(result).toEqual(mockRate);
      expect(dollarRateService.getCurrentRate).toHaveBeenCalled();
    });
  });

  describe('getRateHistory', () => {
    it('should return rate history', async () => {
      dollarRateService.getRateHistory.mockResolvedValue([mockRate]);

      const result = await controller.getRateHistory();

      expect(result).toEqual([mockRate]);
      expect(dollarRateService.getRateHistory).toHaveBeenCalledWith(30);
    });

    it('should use provided limit', async () => {
      dollarRateService.getRateHistory.mockResolvedValue([mockRate]);

      await controller.getRateHistory(10);

      expect(dollarRateService.getRateHistory).toHaveBeenCalledWith(10);
    });
  });

  describe('updateRate', () => {
    it('should update rate', async () => {
      dollarRateService.updateRate.mockResolvedValue({ ...mockRate, rate: 40.0 });

      const result = await controller.updateRate(40.0);

      expect(result.rate).toBe(40.0);
      expect(dollarRateService.updateRate).toHaveBeenCalledWith(40.0, 'admin');
    });
  });
});
