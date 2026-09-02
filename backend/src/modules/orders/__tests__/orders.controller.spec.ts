import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from '../orders.controller';
import { OrdersService } from '../orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  const mockOrder = {
    id: 'order-123',
    order_number: 'ORD-001',
    total: 5.00,
    status: 'pending',
  };

  beforeEach(async () => {
    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create order from cart', async () => {
      const createOrderDto = { notes: 'Leave at door' };

      ordersService.create.mockResolvedValue({
        message: 'Order created successfully',
        order: mockOrder,
      });

      const result = await controller.create(
        { user: { id: 'user-123' } },
        createOrderDto
      );

      expect(result.message).toBe('Order created successfully');
      expect(result.order).toHaveProperty('id');
      expect(ordersService.create).toHaveBeenCalledWith('user-123', createOrderDto);
    });
  });

  describe('findAll', () => {
    it('should return user orders', async () => {
      const mockResult = {
        orders: [mockOrder],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };

      ordersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        { user: { id: 'user-123' } },
        1,
        10
      );

      expect(result).toEqual(mockResult);
      expect(ordersService.findAll).toHaveBeenCalledWith('user-123', 1, 10);
    });

    it('should use default pagination', async () => {
      ordersService.findAll.mockResolvedValue({
        orders: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      await controller.findAll({ user: { id: 'user-123' } });

      expect(ordersService.findAll).toHaveBeenCalledWith('user-123', 1, 10);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      ordersService.findOne.mockResolvedValue({
        ...mockOrder,
        items: [],
      });

      const result = await controller.findOne(
        { user: { id: 'user-123' } },
        'order-123'
      );

      expect(result).toHaveProperty('id');
      expect(ordersService.findOne).toHaveBeenCalledWith('user-123', 'order-123');
    });
  });
});
