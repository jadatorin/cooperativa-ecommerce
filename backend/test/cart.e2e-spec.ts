import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { CartController } from '../src/modules/cart/cart.controller';
import { CartService } from '../src/modules/cart/cart.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';
import { generateTestToken, TEST_JWT_SECRET_CONST } from './test-tokens';

const mockUser = { id: 'user-uuid-123', email: 'test@example.com', role: 'customer' };

/** Register mock Passport JWT strategy before any test module compiles */
function registerMockJwtStrategy() {
  try {
    passport.use(
      'jwt',
      new Strategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: TEST_JWT_SECRET_CONST,
        },
        (payload: any, done: any) => {
          done(null, {
            id: payload.sub,
            email: payload.email,
            fullName: 'Test User',
            role: 'customer',
          });
        },
      ),
    );
  } catch {
    // Strategy already registered — ignore
  }
}

describe('Cart (e2e)', () => {
  let app: INestApplication;
  let cartService: any;
  let authToken: string;

  const mockCartItem = {
    id: 'item-uuid-123',
    cart_id: 'cart-uuid-123',
    product_id: 'prod-uuid-123',
    quantity: 2,
    unit_price: 5.99,
    subtotal: 11.98,
  };

  beforeAll(async () => {
    registerMockJwtStrategy();

    // Generate a real JWT token for authenticated requests
    authToken = generateTestToken({ sub: mockUser.id, email: mockUser.email });

    cartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
    };

    const mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
      getAuthClient: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || TEST_JWT_SECRET_CONST,
            signOptions: { expiresIn: '7d' },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [CartController],
      providers: [
        { provide: CartService, useValue: cartService },
        { provide: SupabaseService, useValue: mockSupabaseService },
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

  describe('GET /api/cart', () => {
    it('should return user cart with items', async () => {
      cartService.getCart.mockResolvedValue({
        id: 'cart-uuid-123',
        items: [mockCartItem],
        total: 11.98,
        itemCount: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body.items).toHaveLength(1);
      expect(response.body.total).toBe(11.98);
    });

    it('should return empty cart', async () => {
      cartService.getCart.mockResolvedValue({
        id: 'cart-uuid-123',
        items: [],
        total: 0,
        itemCount: 0,
      });

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /api/cart/items', () => {
    it('should add item to cart', async () => {
      cartService.addItem.mockResolvedValue(mockCartItem);

      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'prod-uuid-123', quantity: 2 })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.quantity).toBe(2);
    });

    it('should reject request without productId', async () => {
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 1 })
        .expect(400);
    });
  });

  describe('PUT /api/cart/items/:itemId', () => {
    it('should update item quantity', async () => {
      cartService.updateItemQuantity.mockResolvedValue({
        ...mockCartItem,
        quantity: 5,
        subtotal: 29.95,
      });

      const response = await request(app.getHttpServer())
        .put('/api/cart/items/item-uuid-123')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.quantity).toBe(5);
    });
  });

  describe('DELETE /api/cart/items/:itemId', () => {
    it('should remove item from cart', async () => {
      cartService.removeItem.mockResolvedValue({ message: 'Item removed from cart' });

      const response = await request(app.getHttpServer())
        .delete('/api/cart/items/item-uuid-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('removed');
    });
  });

  describe('DELETE /api/cart', () => {
    it('should clear entire cart', async () => {
      cartService.clearCart.mockResolvedValue({ message: 'Cart cleared' });

      const response = await request(app.getHttpServer())
        .delete('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('cleared');
    });
  });

  describe('Cart enrichment', () => {
    it('should return cart items with product details', async () => {
      cartService.getCart.mockResolvedValue({
        id: 'cart-uuid-123',
        items: [
          {
            ...mockCartItem,
            product: { id: 'prod-uuid-123', name: 'Coffee', price: 5.99 },
          },
        ],
        total: 11.98,
        itemCount: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.items[0]).toHaveProperty('product');
      expect(response.body.items[0].product.name).toBe('Coffee');
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/cart')
        .expect(401);
    });
  });
});
