import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../cart.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { ProductsService } from '../../products/products.service';
import { NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let productsService: jest.Mocked<ProductsService>;

  const mockCart = {
    id: 'cart-123',
    user_id: 'user-123',
    status: 'active',
    total: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockProduct = {
    id: 'product-123',
    name: 'Arroz 1kg',
    price: 2.50,
    is_available: true,
  };

  const mockCartItem = {
    id: 'item-123',
    cart_id: 'cart-123',
    product_id: 'product-123',
    quantity: 2,
    unit_price: 2.50,
    subtotal: 5.00,
    created_at: new Date().toISOString(),
  };

  /**
   * Creates a self-referencing Supabase mock where every chain method
   * returns the mock itself, and awaiting the chain or calling .single()
   * resolves to a configurable result via a FIFO queue.
   */
  function createSupabaseMock() {
    const mock: Record<string, any> = {};
    let resultQueue: any[] = [];
    let defaultResult: any = { data: null, error: null, count: null };

    const dequeue = () => {
      if (resultQueue.length > 0) return resultQueue.shift();
      return defaultResult;
    };

    const chainMethods = [
      'from', 'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'in', 'is', 'order', 'range', 'limit', 'offset',
      'insert', 'update', 'upsert', 'delete', 'count',
    ];
    for (const method of chainMethods) {
      mock[method] = jest.fn().mockReturnValue(mock);
    }

    mock.single = jest.fn().mockImplementation(() => Promise.resolve(dequeue()));

    mock.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve(dequeue()).then(onFulfilled, onRejected);

    mock.__enqueue = (result: any) => resultQueue.push(result);
    mock.__setResult = (result: any) => {
      defaultResult = result;
      mock.single.mockReset();
      mock.single.mockImplementation(() => Promise.resolve(result));
    };
    mock.__clearQueue = () => {
      resultQueue = [];
      defaultResult = { data: null, error: null, count: null };
      mock.single.mockReset();
      mock.single.mockImplementation(() => Promise.resolve(defaultResult));
      mock.then = (onFulfilled: any, onRejected?: any) =>
        Promise.resolve(dequeue()).then(onFulfilled, onRejected);
    };

    return mock;
  }

  let mockSupabaseClient: ReturnType<typeof createSupabaseMock>;

  beforeEach(async () => {
    mockSupabaseClient = createSupabaseMock();

    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    productsService = {
      findOne: jest.fn().mockResolvedValue(mockProduct),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      mockSupabaseClient.__enqueue({
        data: mockCart,
        error: null,
      });

      const result = await service.getOrCreateCart('user-123');

      expect(result).toEqual(mockCart);
    });

    it('should create new cart if none exists', async () => {
      // First single returns no cart, second returns the new cart
      mockSupabaseClient.__enqueue({ data: null, error: null });
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });

      const result = await service.getOrCreateCart('user-123');

      expect(result).toEqual(mockCart);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });
  });

  describe('getCart', () => {
    it('should return cart with items', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // getCart items query → chain await
      mockSupabaseClient.__enqueue({ data: [mockCartItem], error: null });

      const result = await service.getCart('user-123');

      expect(result.id).toBe(mockCart.id);
      expect(result.items).toEqual([mockCartItem]);
      expect(result.total).toBe(5.00);
      expect(result.itemCount).toBe(1);
    });

    it('should return empty cart', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // getCart items query → chain await
      mockSupabaseClient.__enqueue({ data: [], error: null });

      const result = await service.getCart('user-123');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.itemCount).toBe(0);
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // Check existing item → single → null
      mockSupabaseClient.__enqueue({ data: null, error: null });
      // Insert → single → mockCartItem
      mockSupabaseClient.__enqueue({ data: mockCartItem, error: null });

      const result = await service.addItem('user-123', {
        productId: 'product-123',
        quantity: 2,
      });

      expect(result).toEqual(mockCartItem);
      expect(productsService.findOne).toHaveBeenCalledWith('product-123');
    });

    it('should update quantity if item already exists', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // Check existing item → single → existing item with qty 1
      mockSupabaseClient.__enqueue({
        data: { ...mockCartItem, quantity: 1 },
        error: null,
      });
      // Update → single → updated item with qty 3
      mockSupabaseClient.__enqueue({
        data: { ...mockCartItem, quantity: 3 },
        error: null,
      });

      const result = await service.addItem('user-123', {
        productId: 'product-123',
        quantity: 2,
      });

      expect(result.quantity).toBe(3);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // Get item → single → mockCartItem
      mockSupabaseClient.__enqueue({ data: mockCartItem, error: null });
      // Update → single → updated item
      mockSupabaseClient.__enqueue({
        data: { ...mockCartItem, quantity: 5 },
        error: null,
      });

      const result = await service.updateItemQuantity('user-123', 'item-123', 5);

      expect(result.quantity).toBe(5);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should remove item if quantity is 0', async () => {
      // updateItemQuantity → getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // removeItem → getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // removeItem → delete → chain await
      mockSupabaseClient.__enqueue({ error: null });

      const result = await service.updateItemQuantity('user-123', 'item-123', 0);

      expect(result.message).toBe('Item removed from cart');
    });

    it('should throw NotFoundException if item not found', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // Get item → single → null
      mockSupabaseClient.__enqueue({ data: null, error: { message: 'Not found' } });

      await expect(
        service.updateItemQuantity('user-123', 'nonexistent', 5)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // delete → chain await
      mockSupabaseClient.__enqueue({ error: null });

      const result = await service.removeItem('user-123', 'item-123');

      expect(result.message).toBe('Item removed from cart');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // delete → chain await
      mockSupabaseClient.__enqueue({ error: { message: 'Delete failed' } });

      await expect(
        service.removeItem('user-123', 'item-123')
      ).rejects.toThrow('Error removing item');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // delete → chain await
      mockSupabaseClient.__enqueue({ error: null });

      const result = await service.clearCart('user-123');

      expect(result.message).toBe('Cart cleared');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      // getOrCreateCart → single → mockCart
      mockSupabaseClient.__enqueue({ data: mockCart, error: null });
      // delete → chain await
      mockSupabaseClient.__enqueue({ error: { message: 'Clear failed' } });

      await expect(service.clearCart('user-123')).rejects.toThrow('Error clearing cart');
    });
  });
});
