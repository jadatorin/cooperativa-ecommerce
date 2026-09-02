import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../products.controller';
import { ProductsService } from '../products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  const mockProduct = {
    id: 'product-123',
    name: 'Arroz 1kg',
    price: 2.50,
    category_slug: 'basicos',
    is_available: true,
  };

  beforeEach(async () => {
    productsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByBarcode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockResult = {
        products: [mockProduct],
        pagination: { page: 1, limit: 18, total: 1, totalPages: 1 },
      };

      productsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 18, 'basicos', 'arroz');

      expect(result).toEqual(mockResult);
      expect(productsService.findAll).toHaveBeenCalledWith(1, 18, 'basicos', 'arroz');
    });

    it('should use default values', async () => {
      productsService.findAll.mockResolvedValue({
        products: [],
        pagination: { page: 1, limit: 18, total: 0, totalPages: 0 },
      });

      await controller.findAll();

      expect(productsService.findAll).toHaveBeenCalledWith(1, 18, undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      productsService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne('product-123');

      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith('product-123');
    });
  });

  describe('findByBarcode', () => {
    it('should return a product by barcode', async () => {
      productsService.findByBarcode.mockResolvedValue(mockProduct);

      const result = await controller.findByBarcode('7591234567890');

      expect(result).toEqual(mockProduct);
      expect(productsService.findByBarcode).toHaveBeenCalledWith('7591234567890');
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto = {
        name: 'Leche 1L',
        price: 1.80,
        category_slug: 'lacteos',
      };

      productsService.create.mockResolvedValue({ ...mockProduct, ...createDto });

      const result = await controller.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(productsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { price: 3.00 };

      productsService.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await controller.update('product-123', updateDto);

      expect(result.price).toBe(3.00);
      expect(productsService.update).toHaveBeenCalledWith('product-123', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      productsService.remove.mockResolvedValue({ message: 'Product deleted successfully' });

      const result = await controller.remove('product-123');

      expect(result.message).toBe('Product deleted successfully');
      expect(productsService.remove).toHaveBeenCalledWith('product-123');
    });
  });
});
