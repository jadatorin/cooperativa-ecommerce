import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@coop.com',
    user_metadata: {
      full_name: 'Test User',
      phone: '+58 412 1234567',
    },
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@coop.com',
    full_name: 'Test User',
    phone: '+58 412 1234567',
    role: 'customer',
  };

  beforeEach(async () => {
    const mockAuth = {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
    };

    const mockSupabaseClient = {
      auth: mockAuth,
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
      getAuthClient: jest.fn().mockReturnValue({ auth: mockAuth }),
    } as any;

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: supabaseService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@coop.com',
        password: 'Password123!',
        fullName: 'Test User',
        phone: '+58 412 1234567',
      };

      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const dbClient = supabaseService.getClient();
      (dbClient.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id');
      expect(result.user.email).toBe(registerDto.email);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already registered', async () => {
      const registerDto = {
        email: 'existing@coop.com',
        password: 'Password123!',
        fullName: 'Test User',
      };

      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw UnauthorizedException on auth error', async () => {
      const registerDto = {
        email: 'test@coop.com',
        password: 'weak',
        fullName: 'Test User',
      };

      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      await expect(service.register(registerDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = {
        email: 'test@coop.com',
        password: 'Password123!',
      };

      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const dbClient = supabaseService.getClient();
      (dbClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile }),
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(loginDto.email);
      expect(result.user.fullName).toBe(mockProfile.full_name);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const loginDto = {
        email: 'test@coop.com',
        password: 'wrong-password',
      };

      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const dbClient = supabaseService.getClient();
      (dbClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile }),
      });

      const result = await service.getProfile('user-123');

      expect(result).toEqual(mockProfile);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const dbClient = supabaseService.getClient();
      (dbClient.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      });

      await expect(service.getProfile('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.refreshSession.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await service.refreshToken('refresh-token-123');

      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException on invalid refresh token', async () => {
      const authClient = supabaseService.getAuthClient() as any;
      authClient.auth.refreshSession.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid refresh token' },
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
