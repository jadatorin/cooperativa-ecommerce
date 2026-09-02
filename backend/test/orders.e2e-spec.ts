import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { OrdersController } from '../src/modules/orders/orders.controller';
import { OrdersService } from '../src/modules/orders/orders.service';
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

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let ordersService: any;
  let authToken: string;

  const mockOrder = {
    id: 'order-uuid-123',
    order_number: 'ORD-001',
    total: 11.98,
    status: 'pending',
  };

  const mockOrderItem = {
    id: 'order-item-uuid-123',
    order_id: mockOrder.id,
    product_id: 'prod-uuid-123',
    quantity: 2,
    unit_price: 5.99,
    subtotal: 11.98,
  };

  beforeAll(async () => {
    registerMockJwtStrategy();

    // Generate a real JWT token for authenticated requests
    authToken = generateTestToken({ sub: mockUser.id, email: mockUser.email });

    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
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
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
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

  describe('POST /api/orders', () => {
    it('should create order from cart', async () => {
      ordersService.create.mockResolvedValue({
        message: 'Order created successfully',
        order: mockOrder,
      });

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Leave at the door' })
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('order');
      expect(response.body.order.id).toBe('order-uuid-123');
      expect(response.body.order.status).toBe('pending');
    });

    it('should reject order from empty cart', async () => {
      ordersService.create.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Cart is empty'),
      );

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(404);
    });
  });

  describe('GET /api/orders', () => {
    it('should return user order history', async () => {
      ordersService.findAll.mockResolvedValue({
        orders: [mockOrder],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

      const response = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.orders)).toBe(true);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.pagination.total).toBe(1);
    });

    it('should return paginated orders', async () => {
      ordersService.findAll.mockResolvedValue({
        orders: [mockOrder],
        pagination: { page: 2, limit: 5, total: 12, totalPages: 3 },
      });

      const response = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 2, limit: 5 })
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.totalPages).toBe(3);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order by ID with items', async () => {
      ordersService.findOne.mockResolvedValue({
        ...mockOrder,
        items: [mockOrderItem],
      });

      const response = await request(app.getHttpServer())
        .get('/api/orders/order-uuid-123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe('order-uuid-123');
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      ordersService.findOne.mockRejectedValue(
        new (require('@nestjs/common').NotFoundException)('Order not found'),
      );

      await request(app.getHttpServer())
        .get('/api/orders/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Unauthenticated access', () => {
    it('should reject unauthenticated requests to orders endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/orders')
        .expect(401);
    });
  });
});
