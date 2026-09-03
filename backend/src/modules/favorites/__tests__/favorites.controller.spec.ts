import { Test, TestingModule } from '@nestjs/testing';
import { FavoritesController } from '../favorites.controller';
import { FavoritesService } from '../favorites.service';

describe('FavoritesController', () => {
  let controller: FavoritesController;
  let favoritesService: jest.Mocked<FavoritesService>;

  const mockFavorite = {
    id: 'fav-123',
    user_id: 'user-123',
    product_id: 'product-123',
    created_at: new Date().toISOString(),
  };

  const mockRequest = {
    user: { id: 'user-123' },
  };

  beforeEach(async () => {
    favoritesService = {
      findAll: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoritesController],
      providers: [
        { provide: FavoritesService, useValue: favoritesService },
      ],
    }).compile();

    controller = module.get<FavoritesController>(FavoritesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return user favorites', async () => {
      favoritesService.findAll.mockResolvedValue([mockFavorite]);

      const result = await controller.findAll(mockRequest as any);

      expect(result).toEqual([mockFavorite]);
      expect(favoritesService.findAll).toHaveBeenCalledWith('user-123');
    });
  });

  describe('add', () => {
    it('should add product to favorites', async () => {
      favoritesService.add.mockResolvedValue({
        message: 'Product added to favorites',
        favorite: mockFavorite,
      });

      const result = await controller.add(mockRequest as any, 'product-123');

      expect(result.message).toBe('Product added to favorites');
      expect(favoritesService.add).toHaveBeenCalledWith('user-123', 'product-123');
    });
  });

  describe('remove', () => {
    it('should remove product from favorites', async () => {
      favoritesService.remove.mockResolvedValue({
        message: 'Product removed from favorites',
      });

      const result = await controller.remove(mockRequest as any, 'product-123');

      expect(result.message).toBe('Product removed from favorites');
      expect(favoritesService.remove).toHaveBeenCalledWith('user-123', 'product-123');
    });
  });
});
