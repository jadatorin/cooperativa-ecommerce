import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../categories.service';
import { SupabaseService } from '../../supabase/supabase.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockCategory = {
    id: 'cat-123',
    name: 'Básicos',
    slug: 'basicos',
    description: 'Productos básicos',
    image_url: 'https://example.com/basicos.jpg',
    sort_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all active categories', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: [mockCategory],
        error: null,
      });

      const result = await service.findAll();

      expect(result).toEqual([mockCategory]);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('app_categories');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('sort_order', { ascending: true });
    });

    it('should throw error on database error', async () => {
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(service.findAll()).rejects.toThrow('Error fetching categories');
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockCategory,
        error: null,
      });

      const result = await service.findBySlug('basicos');

      expect(result).toEqual(mockCategory);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', 'basicos');
    });

    it('should throw error if category not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(service.findBySlug('nonexistent')).rejects.toThrow('Category not found');
    });
  });
});
