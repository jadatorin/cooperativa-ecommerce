import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockProduct = {
    id: 'product-123',
    name: 'Arroz 1kg',
    barcode: '7591234567890',
    description: 'Arroz premium',
    price: 2.50,
    image_url: 'https://example.com/arroz.jpg',
    category_slug: 'basicos',
    is_available: true,
    quantity_stock: 100,
    weight_sold: false,
    tags: ['arroz', 'granos'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  /**
   * Creates a self-referencing Supabase mock where every chain method
   * returns the mock itself, and awaiting the chain resolves to a
   * configurable result.
   */
  function createSupabaseMock() {
    const mock: Record<string, any> = {};
    let resultQueue: any[] = [];
    let defaultResult: any = { data: null, error: null, count: null };

    const dequeue = () => {
      if (resultQueue.length > 0) return resultQueue.shift();
      return defaultResult;
    };

    // All chain methods return the mock itself
    const chainMethods = [
      'from', 'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'in', 'is', 'order', 'range', 'limit', 'offset',
      'insert', 'update', 'upsert', 'delete', 'count',
    ];
    for (const method of chainMethods) {
      mock[method] = jest.fn().mockReturnValue(mock);
    }

    // Terminal method: single()
    mock.single = jest.fn().mockImplementation(() => Promise.resolve(dequeue()));

    // Make the mock thenable so `await chain` resolves to the next queued result
    mock.then = (onFulfilled: any, onRejected?: any) =>
      Promise.resolve(dequeue()).then(onFulfilled, onRejected);

    // Test helpers
    mock.__enqueue = (result: any) => resultQueue.push(result);
    mock.__setResult = (result: any) => {
      defaultResult = result;
      // Also override single to return this result
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [mockProduct];
      mockSupabaseClient.__setResult({
        data: mockProducts,
        error: null,
        count: 1,
      });

      const result = await service.findAll(1, 18);

      expect(result.products).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 18,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter by category', async () => {
      mockSupabaseClient.__setResult({
        data: [mockProduct],
        error: null,
        count: 1,
      });

      await service.findAll(1, 18, 'basicos');

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('category_slug', 'basicos');
    });

    it('should filter by search term', async () => {
      mockSupabaseClient.__setResult({
        data: [mockProduct],
        error: null,
        count: 1,
      });

      await service.findAll(1, 18, undefined, 'arroz');

      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('name', '%arroz%');
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.__setResult({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(service.findAll()).rejects.toThrow('Error fetching products');
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockSupabaseClient.__setResult({
        data: mockProduct,
        error: null,
      });

      const result = await service.findOne('product-123');

      expect(result).toEqual(mockProduct);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'product-123');
    });

    it('should throw NotFoundException if product not found', async () => {
      mockSupabaseClient.__setResult({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByBarcode', () => {
    it('should return a product by barcode', async () => {
      mockSupabaseClient.__setResult({
        data: mockProduct,
        error: null,
      });

      const result = await service.findByBarcode('7591234567890');

      expect(result).toEqual(mockProduct);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('barcode', '7591234567890');
    });

    it('should throw NotFoundException if barcode not found', async () => {
      mockSupabaseClient.__setResult({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findByBarcode('0000000000000')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createDto = {
        name: 'Leche 1L',
        price: 1.80,
        category_slug: 'lacteos',
      };

      mockSupabaseClient.__setResult({
        data: { ...mockProduct, ...createDto },
        error: null,
      });

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.price).toBe(createDto.price);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.__setResult({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(service.create({ name: 'Test', price: 1 })).rejects.toThrow('Error creating product');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { price: 3.00 };

      mockSupabaseClient.__setResult({
        data: { ...mockProduct, ...updateDto },
        error: null,
      });

      const result = await service.update('product-123', updateDto);

      expect(result.price).toBe(3.00);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.__setResult({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(service.update('product-123', { price: 3 })).rejects.toThrow('Error updating product');
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      mockSupabaseClient.__setResult({
        error: null,
      });

      const result = await service.remove('product-123');

      expect(result.message).toBe('Product deleted successfully');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.__setResult({
        error: { message: 'Delete failed' },
      });

      await expect(service.remove('product-123')).rejects.toThrow('Error deleting product');
    });
  });
});
