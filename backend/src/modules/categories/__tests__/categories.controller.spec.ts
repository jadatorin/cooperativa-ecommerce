import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from '../categories.controller';
import { CategoriesService } from '../categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let categoriesService: jest.Mocked<CategoriesService>;

  const mockCategory = {
    id: 'cat-123',
    name: 'Básicos',
    slug: 'basicos',
    description: 'Productos básicos',
    image_url: 'https://example.com/basicos.jpg',
    sort_order: 1,
    is_active: true,
  };

  beforeEach(async () => {
    categoriesService = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: categoriesService },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      categoriesService.findAll.mockResolvedValue([mockCategory]);

      const result = await controller.findAll();

      expect(result).toEqual([mockCategory]);
      expect(categoriesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return a category by slug', async () => {
      categoriesService.findBySlug.mockResolvedValue(mockCategory);

      const result = await controller.findBySlug('basicos');

      expect(result).toEqual(mockCategory);
      expect(categoriesService.findBySlug).toHaveBeenCalledWith('basicos');
    });
  });
});
