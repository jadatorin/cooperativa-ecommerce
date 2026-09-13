import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { CartService } from '../../cart/cart.service';

describe('OrdersService - Payment Report', () => {
  let service: OrdersService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let cartService: jest.Mocked<CartService>;

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
    },
    {
      id: 'order-2',
      order_number: 1002,
      user_id: 'user-123',
      total: 50.00,
      subtotal: 45.00,
      tax: 5.00,
      payment_method: 'card',
      payment_status: 'pending',
      paid_at: null,
      status: 'pending',
      created_at: '2026-01-16T10:00:00Z',
    },
  ];

  let mockSupabaseClient: any;

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn(),
      clearCart: jest.fn(),
    } as any;

    // The summary query chains: from -> select -> eq -> gte -> lte (terminal)
    // The main query chains: from -> select -> eq -> order -> range (terminal)
    // We need both queries to resolve independently.

    const summaryResult = { data: mockOrders, error: null };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnValue({
        then: (resolve: any, reject: any) => Promise.resolve(summaryResult).then(resolve, reject),
      }),
      order: jest.fn().mockReturnThis(),
      range: jest.fn(),
      single: jest.fn(),
    };

    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: CartService, useValue: cartService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();

    // After clearAllMocks, re-set the mockReturnThis and lte since clearAllMocks resets them
    mockSupabaseClient.from.mockReturnThis();
    mockSupabaseClient.select.mockReturnThis();
    mockSupabaseClient.eq.mockReturnThis();
    mockSupabaseClient.gte.mockReturnThis();
    mockSupabaseClient.order.mockReturnThis();
    mockSupabaseClient.lte.mockReturnValue({
      then: (resolve: any, reject: any) => Promise.resolve(summaryResult).then(resolve, reject),
    });
  });

  describe('getPaymentReport', () => {
    it('should return paginated payment data with summary', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: mockOrders,
        error: null,
        count: 2,
      });

      const result = await service.getPaymentReport('user-123', {
        page: 1,
        limit: 10,
      });

      expect(result.payments).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(result.summary).toBeDefined();
      expect(result.summary.total_orders).toBe(2);
      expect(result.summary.total_amount).toBe(150.00);
      expect(result.summary.total_subtotal).toBe(135.00);
      expect(result.summary.total_tax).toBe(15.00);
      expect(result.summary.paid_count).toBe(1);
      expect(result.summary.paid_amount).toBe(100.00);
      expect(result.summary.pending_count).toBe(1);
      expect(result.summary.pending_amount).toBe(50.00);
    });

    it('should filter by payment status', async () => {
      const paidOrders = [mockOrders[0]];
      mockSupabaseClient.lte.mockReturnValue({
        then: (resolve: any, reject: any) => Promise.resolve({ data: paidOrders, error: null }).then(resolve, reject),
      });

      mockSupabaseClient.range.mockResolvedValue({
        data: paidOrders,
        error: null,
        count: 1,
      });

      const result = await service.getPaymentReport('user-123', {
        payment_status: 'paid',
        page: 1,
        limit: 10,
      });

      expect(result.payments).toEqual(paidOrders);
      expect(result.summary.paid_count).toBe(1);
      expect(result.summary.pending_count).toBe(0);
    });

    it('should return empty results with zero summary when no orders match', async () => {
      mockSupabaseClient.lte.mockReturnValue({
        then: (resolve: any, reject: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
      });

      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.getPaymentReport('user-123', {
        payment_status: 'refunded',
        page: 1,
        limit: 10,
      });

      expect(result.payments).toEqual([]);
      expect(result.summary.total_orders).toBe(0);
      expect(result.summary.total_amount).toBe(0);
      expect(result.summary.paid_count).toBe(0);
      expect(result.summary.pending_count).toBe(0);
    });

    it('should throw error on database failure', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
        count: null,
      });

      await expect(
        service.getPaymentReport('user-123', { page: 1, limit: 10 })
      ).rejects.toThrow('Error fetching payment report');
    });
  });
});
