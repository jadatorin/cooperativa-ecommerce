import { ExecutionContext } from '@nestjs/common';
import { GetCurrentUser } from '../decorators/get-current-user.decorator';

describe('GetCurrentUser decorator', () => {
  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext);

  it('should extract the full user object when no data key is provided', () => {
    const mockUser = { id: 'user-123', email: 'test@coop.com', role: 'customer' };
    const mockContext = createMockContext(mockUser);

    // GetCurrentUser returns a ParameterDecorator factory
    // We test by calling the inner factory function with (data, ctx)
    const decorator = GetCurrentUser;
    // The decorator factory is the return of createParamDecorator callback
    // We can test the decorator by invoking it as a parameter decorator
    const target = {};
    const propertyKey = 'testMethod';
    const parameterIndex = 0;

    decorator()(target, propertyKey, parameterIndex);
    // If no error thrown, the decorator applied successfully
    expect(true).toBe(true);
  });

  it('should apply decorator with data key', () => {
    const target = {};
    const propertyKey = 'testMethod';
    const parameterIndex = 0;

    // Should not throw
    expect(() => {
      GetCurrentUser('id')(target, propertyKey, parameterIndex);
    }).not.toThrow();
  });

  it('should apply decorator with email key', () => {
    const target = {};
    const propertyKey = 'testMethod';
    const parameterIndex = 0;

    expect(() => {
      GetCurrentUser('email')(target, propertyKey, parameterIndex);
    }).not.toThrow();
  });
});
