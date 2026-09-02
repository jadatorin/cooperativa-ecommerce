import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../dto/login.dto';

describe('LoginDto', () => {
  it('should be defined', () => {
    expect(LoginDto).toBeDefined();
  });

  describe('validation', () => {
    it('should accept valid login data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject missing email', async () => {
      const dto = plainToInstance(LoginDto, {
        password: 'Password123!',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'not-an-email',
        password: 'Password123!',
      });

      const errors = await validate(dto);
      const emailError = errors.find((e) => e.property === 'email');
      expect(emailError).toBeDefined();
    });

    it('should reject missing password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });

    it('should reject non-string password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'user@example.com',
        password: 12345,
      });

      const errors = await validate(dto);
      const passwordError = errors.find((e) => e.property === 'password');
      expect(passwordError).toBeDefined();
    });
  });
});
