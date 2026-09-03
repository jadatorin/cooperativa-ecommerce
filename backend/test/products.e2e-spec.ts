import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { ProductsController } from '../src/modules/products/products.controller';
import { ProductsService } from '../src/modules/products/products.service';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let productsService: any;

  const mockProducts = [
    { id: 'prod-1', name: 'Coffee', price: 5.99, category_slug: 'beverages', is_available: true },
    { id: 'prod-2', name: 'Bread', price: 2.49, category_slug: 'bakery', is_available: true },
    { id: 'prod-3', name: 'Milk', price: 1.99, category_slug: 'dairy', is_available: true },
  ];

  beforeAll(async () => {
    productsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByBarcode: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
      ],
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /api/products', () => {
    it('should return paginated product list', async () => {
      productsService.findAll.mockResolvedValue({
        products: mockProducts,
        pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
      });

      const response = await request(app.getHttpServer())
        .get('/api/products')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page');
    });

    it('should filter products by category', async () => {
      productsService.findAll.mockResolvedValue({
        products: [mockProducts[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const response = await request(app.getHttpServer())
        .get('/api/products')
        .query({ category: 'beverages' })
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].category_slug).toBe('beverages');
    });

    it('should search products by name', async () => {
      productsService.findAll.mockResolvedValue({
        products: [mockProducts[0]],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      await request(app.getHttpServer())
        .get('/api/products')
        .query({ search: 'Coffee' })
        .expect(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      productsService.findOne.mockResolvedValue(mockProducts[0]);

      const response = await request(app.getHttpServer())
        .get('/api/products/prod-1')
        .expect(200);

      expect(response.body.name).toBe('Coffee');
      expect(response.body.price).toBe(5.99);
    });

    it('should return 404 for non-existent product', async () => {
      productsService.findOne.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Product not found'),
      );

      await request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/products/barcode/:barcode', () => {
    it('should return product by barcode', async () => {
      productsService.findByBarcode.mockResolvedValue(mockProducts[0]);

      const response = await request(app.getHttpServer())
        .get('/api/products/barcode/123456')
        .expect(200);

      expect(response.body.name).toBe('Coffee');
    });

    it('should return 404 for non-existent barcode', async () => {
      productsService.findByBarcode.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Product not found'),
      );

      await request(app.getHttpServer())
        .get('/api/products/barcode/999999')
        .expect(404);
    });
  });
});
