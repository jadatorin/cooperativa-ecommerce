import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from '../dto/create-order.dto';

describe('CreateOrderDto', () => {
  it('should be defined', () => {
    expect(CreateOrderDto).toBeDefined();
  });

  describe('validation', () => {
    it('should accept valid order data', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        notes: 'Leave at the door',
        quantity: 2,
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept empty object (all fields optional)', async () => {
      const dto = plainToInstance(CreateOrderDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject negative quantity', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        quantity: -1,
      });

      const errors = await validate(dto);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
    });

    it('should reject zero quantity', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        quantity: 0,
      });

      const errors = await validate(dto);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
    });

    it('should accept quantity of 1 (minimum)', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        quantity: 1,
      });

      const errors = await validate(dto);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeUndefined();
    });

    it('should reject non-string notes', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        notes: 12345,
      });

      const errors = await validate(dto);
      const notesError = errors.find((e) => e.property === 'notes');
      expect(notesError).toBeDefined();
    });

    it('should reject non-number quantity', async () => {
      const dto = plainToInstance(CreateOrderDto, {
        quantity: 'abc',
      });

      const errors = await validate(dto);
      const quantityError = errors.find((e) => e.property === 'quantity');
      expect(quantityError).toBeDefined();
    });
  });
});
