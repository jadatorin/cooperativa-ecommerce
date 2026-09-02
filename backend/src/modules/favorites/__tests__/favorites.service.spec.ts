import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesService } from '../favorites.service';
import { SupabaseService } from '../../supabase/supabase.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockFavorite = {
    id: 'fav-123',
    user_id: 'user-123',
    product_id: 'product-123',
    created_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    supabaseService = {
      getClient: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all favorites for a user', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [mockFavorite],
          error: null,
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.findAll('user-123');

      expect(result).toEqual([mockFavorite]);
      expect(chain.from).toHaveBeenCalledWith('app_favorites');
      expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should throw error on database error', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      await expect(service.findAll('user-123')).rejects.toThrow('Error fetching favorites');
    });
  });

  describe('add', () => {
    it('should add a product to favorites', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockFavorite,
          error: null,
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.add('user-123', 'product-123');

      expect(result.message).toBe('Product added to favorites');
      expect(result.favorite).toEqual(mockFavorite);
      expect(chain.insert).toHaveBeenCalled();
    });

    it('should handle duplicate favorite gracefully', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key' },
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.add('user-123', 'product-123');

      expect(result.message).toBe('Product already in favorites');
    });

    it('should throw error on other database errors', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'OTHER', message: 'Insert failed' },
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      await expect(service.add('user-123', 'product-123')).rejects.toThrow('Error adding favorite');
    });
  });

  describe('remove', () => {
    it('should remove a product from favorites', async () => {
      // Chain: from().delete().eq('user_id').eq('product_id')
      // The second .eq needs to resolve the promise
      const eq2 = jest.fn().mockResolvedValue({ error: null });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const chain = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnValue({ eq: eq1 }),
        eq: jest.fn(),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.remove('user-123', 'product-123');

      expect(result.message).toBe('Product removed from favorites');
      expect(chain.from).toHaveBeenCalledWith('app_favorites');
      expect(chain.delete).toHaveBeenCalled();
      expect(eq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(eq2).toHaveBeenCalledWith('product_id', 'product-123');
    });

    it('should throw error on database error', async () => {
      const eq2 = jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const chain = {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnValue({ eq: eq1 }),
        eq: jest.fn(),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      await expect(service.remove('user-123', 'product-123')).rejects.toThrow('Error removing favorite');
    });
  });

  describe('isFavorite', () => {
    it('should return true if product is in favorites', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'fav-123' },
          error: null,
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.isFavorite('user-123', 'product-123');

      expect(result).toBe(true);
    });

    it('should return false if product is not in favorites', async () => {
      const chain = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };
      supabaseService.getClient.mockReturnValue(chain as any);

      const result = await service.isFavorite('user-123', 'product-123');

      expect(result).toBe(false);
    });
  });
});
