import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow request when user is authenticated', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: { id: 'user-123', email: 'test@coop.com' },
          }),
        }),
      } as unknown as ExecutionContext;

      // Mock the parent class canActivate by overriding
      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should reject request when user is not authenticated', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });
  });
});
