import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { SupabaseService } from '../../supabase/supabase.service';

describe('AdminService - Payment Report', () => {
  let service: AdminService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let mockSupabaseClient: any;

  const mockOrders = [
    {
      id: 'order-1',
      order_number: 1001,
      user_id: 'user-123',
      total: 100.00,
      subtotal: 90.00,
      tax: 10.00,
      payment_method: 'cash',
      payment_status: 'paid',
      paid_at: '2026-01-15T10:00:00Z',
      status: 'delivered',
      created_at: '2026-01-15T10:00:00Z',
      app_users: { email: 'user@test.com', full_name: 'Test User' },
    },
    {
      id: 'order-2',
      order_number: 1002,
      user_id: 'user-456',
      total: 50.00,
      subtotal: 45.00,
      tax: 5.00,
      payment_method: 'card',
      payment_status: 'pending',
      paid_at: null,
      status: 'pending',
      created_at: '2026-01-16T10:00:00Z',
      app_users: { email: 'another@test.com', full_name: 'Another User' },
    },
  ];

  /** Create a thenable with chainable methods for Supabase mock */
  function makeThenable(result: any) {
    const chain: any = {};
    chain.eq = jest.fn().mockReturnValue(chain);
    chain.gte = jest.fn().mockReturnValue(chain);
    chain.lte = jest.fn().mockReturnValue(chain);
    chain.or = jest.fn().mockReturnValue(chain);
    chain.order = jest.fn().mockReturnValue(chain);
    chain.range = jest.fn().mockResolvedValue(result);
    chain.then = (onFulfilled?: any, onRejected?: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected);
    return chain;
  }

  beforeEach(async () => {
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPaymentReport', () => {
    it('should return paginated payment data with correct summary structure', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.getPaymentReport({
        page: 1,
        limit: 20,
      });

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(result.summary).toEqual({
        total_orders: 2,
        total_amount: 150.00,
        total_subtotal: 135.00,
        total_tax: 15.00,
        paid_count: 1,
        paid_amount: 100.00,
        pending_count: 1,
        pending_amount: 50.00,
      });
    });

    it('should filter by payment status', async () => {
      const paidOrders = [mockOrders[0]];

      const thenable = makeThenable({
        data: paidOrders,
        error: null,
        count: 1,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.getPaymentReport({
        payment_status: 'paid',
        page: 1,
        limit: 20,
      });

      expect(result.orders).toEqual(paidOrders);
      expect(result.summary.paid_count).toBe(1);
      expect(result.summary.pending_count).toBe(0);
    });

    it('should filter by order status', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await service.getPaymentReport({
        order_status: 'delivered',
        page: 1,
        limit: 20,
      });

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'delivered');
    });

    it('should search by order number', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await service.getPaymentReport({
        search: '1001',
        page: 1,
        limit: 20,
      });

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        'order_number.eq.1001,app_users.email.ilike.%1001%'
      );
    });

    it('should filter by date range', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await service.getPaymentReport({
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        page: 1,
        limit: 20,
      });

      expect(mockSupabaseClient.gte).toHaveBeenCalledWith('created_at', '2026-01-01');
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('created_at', '2026-12-31');
    });

    it('should return zero summary when no orders match', async () => {
      const thenable = makeThenable({
        data: [],
        error: null,
        count: 0,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.getPaymentReport({
        payment_status: 'refunded',
        page: 1,
        limit: 20,
      });

      expect(result.orders).toEqual([]);
      expect(result.summary).toEqual({
        total_orders: 0,
        total_amount: 0,
        total_subtotal: 0,
        total_tax: 0,
        paid_count: 0,
        paid_amount: 0,
        pending_count: 0,
        pending_amount: 0,
      });
    });

    it('should throw error on database failure', async () => {
      const thenable = makeThenable({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await expect(
        service.getPaymentReport({ page: 1, limit: 20 })
      ).rejects.toThrow('Error fetching payment report');
    });
  });

  describe('exportPaymentReport', () => {
    it('should export CSV with correct headers including subtotal and tax', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.exportPaymentReport({
        format: 'csv',
        page: 1,
        limit: 20,
      });

      expect(result.csv).toBeDefined();
      const lines = result.csv!.split('\n');
      const headers = lines[0];
      expect(headers).toContain('Subtotal');
      expect(headers).toContain('Tax');
      expect(headers).toContain('Payment Status');
      expect(headers).toContain('Order Status');
      expect(headers).toContain('Paid At');
    });

    it('should export JSON format', async () => {
      const thenable = makeThenable({
        data: mockOrders,
        error: null,
        count: 2,
      });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.exportPaymentReport({
        format: 'json',
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual(mockOrders);
      expect(result.summary).toBeDefined();
    });
  });
});
