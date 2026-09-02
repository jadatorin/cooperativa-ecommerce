import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@coop.com',
    fullName: 'Test User',
    role: 'customer',
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      refreshToken: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@coop.com',
        password: 'Password123!',
        fullName: 'Test User',
      };

      authService.register.mockResolvedValue({
        user: mockUser,
        token: 'jwt-token',
      });

      const result = await controller.register(registerDto);

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id');
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto = {
        email: 'test@coop.com',
        password: 'Password123!',
      };

      authService.login.mockResolvedValue({
        user: mockUser,
        token: 'jwt-token',
      });

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(mockUser.email);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      authService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile({ user: { id: 'user-123' } });

      expect(result).toEqual(mockUser);
      expect(authService.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('refresh', () => {
    it('should refresh token', async () => {
      authService.refreshToken.mockResolvedValue({ token: 'new-jwt-token' });

      const result = await controller.refresh('refresh-token');

      expect(result).toHaveProperty('token');
      expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
    });
  });
});
