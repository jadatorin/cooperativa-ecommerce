import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../orders.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { CartService } from '../../cart/cart.service';
import { NotFoundException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let cartService: jest.Mocked<CartService>;

  const mockCart = {
    id: 'cart-123',
    items: [
      {
        id: 'item-123',
        product_id: 'product-123',
        quantity: 2,
        unit_price: 2.50,
        subtotal: 5.00,
      },
    ],
    total: 5.00,
    itemCount: 1,
  };

  const mockOrder = {
    id: 'order-123',
    order_number: 'ORD-001',
    user_id: 'user-123',
    total: 5.00,
    notes: 'Leave at door',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    items: [
      {
        id: 'item-123',
        product_id: 'product-123',
        quantity: 2,
        unit_price: 2.50,
        subtotal: 5.00,
      },
    ],
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(async () => {
    cartService = {
      getCart: jest.fn().mockResolvedValue(mockCart),
      clearCart: jest.fn().mockResolvedValue({ message: 'Cart cleared' }),
    } as any;

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create order from cart', async () => {
      // Mock order insert
      mockSupabaseClient.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      });

      // Mock order items insert
      mockSupabaseClient.insert.mockResolvedValue({
        error: null,
      });

      const result = await service.create('user-123', {
        notes: 'Leave at door',
      });

      expect(result.message).toBe('Order created successfully');
      expect(result.order).toHaveProperty('id');
      expect(result.order.total).toBe(5.00);
      expect(cartService.clearCart).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException if cart is empty', async () => {
      cartService.getCart.mockResolvedValue({
        id: 'cart-123',
        items: [],
        total: 0,
        itemCount: 0,
      });

      await expect(
        service.create('user-123', { notes: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on order creation failure', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(
        service.create('user-123', { notes: 'Test' })
      ).rejects.toThrow('Error creating order');
    });

    it('should throw error on order items creation failure', async () => {
      // Mock order creation success
      mockSupabaseClient.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      });

      // Mock items insert failure
      mockSupabaseClient.insert.mockResolvedValue({
        error: { message: 'Items insert failed' },
      });

      await expect(
        service.create('user-123', { notes: 'Test' })
      ).rejects.toThrow('Error creating order items');
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [mockOrder],
        error: null,
        count: 1,
      });

      const result = await service.findAll('user-123', 1, 10);

      expect(result.orders).toEqual([mockOrder]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('should use default pagination', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.findAll('user-123');

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(service.findAll('user-123')).rejects.toThrow('Error fetching orders');
    });
  });

  describe('findOne', () => {
    it('should return order with items', async () => {
      // Mock order
      mockSupabaseClient.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      });

      // Mock order items
      mockSupabaseClient.select.mockResolvedValue({
        data: mockOrder.items || [],
        error: null,
      });

      const result = await service.findOne('user-123', 'order-123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('items');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        service.findOne('user-123', 'nonexistent')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
