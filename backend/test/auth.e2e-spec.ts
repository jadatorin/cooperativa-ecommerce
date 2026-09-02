import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { SupabaseService } from '../src/modules/supabase/supabase.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: any;

  const mockUser = {
    id: 'user-uuid-123',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '1234567890',
    role: 'customer',
  };

  beforeAll(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      refreshToken: jest.fn(),
    };

    // Register a mock Passport JWT strategy that always succeeds
    passport.use(
      'jwt',
      new Strategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: 'test-secret',
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            signOptions: { expiresIn: '7d' },
          }),
          inject: [ConfigService],
        }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
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

  describe('POST /api/auth/register', () => {
    it('should register a new user and return JWT', async () => {
      authService.register.mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email, fullName: mockUser.full_name },
        token: 'jwt-token-abc',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBe('jwt-token-abc');
    });

    it('should reject registration with missing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          password: 'password123',
          fullName: 'Test User',
        })
        .expect(400);
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
          fullName: 'Test User',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return JWT for valid credentials', async () => {
      authService.login.mockResolvedValue({
        user: { id: mockUser.id, email: mockUser.email, fullName: mockUser.full_name, role: mockUser.role },
        token: 'jwt-token-login',
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login with missing password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(400);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should reject unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should reject invalid refresh token', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});
