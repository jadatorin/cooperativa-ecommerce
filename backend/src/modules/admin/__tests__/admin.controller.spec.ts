import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: jest.Mocked<AdminService>;

  const mockUser = { id: 'admin-123', email: 'admin@test.com', role: 'admin' };

  beforeEach(async () => {
    adminService = {
      dashboard: jest.fn(),
      getUsers: jest.fn(),
      updateUserRole: jest.fn(),
      getOrders: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('dashboard', () => {
    it('should return dashboard stats', async () => {
      const mockStats = { users: 10, products: 25, orders: 50, revenue: 1500 };
      adminService.dashboard.mockResolvedValue(mockStats);

      const result = await controller.dashboard({ user: mockUser });

      expect(result).toEqual(mockStats);
      expect(adminService.dashboard).toHaveBeenCalledWith('admin-123');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        users: [
          { id: 'u1', email: 'user@test.com', full_name: 'Test', role: 'user', created_at: '2026-01-01' },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      adminService.getUsers.mockResolvedValue(mockResult);

      const result = await controller.getUsers(
        { user: mockUser },
        { page: '1', limit: '20' }
      );

      expect(result).toEqual(mockResult);
      expect(adminService.getUsers).toHaveBeenCalledWith('1', '20');
    });

    it('should handle missing query params', async () => {
      adminService.getUsers.mockResolvedValue({
        users: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      await controller.getUsers({ user: mockUser }, {});

      expect(adminService.getUsers).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const mockResult = { message: 'User role updated successfully', userId: 'u1', role: 'admin' };
      adminService.updateUserRole.mockResolvedValue(mockResult);

      const result = await controller.updateUserRole(
        { user: mockUser },
        'u1',
        { role: 'admin' }
      );

      expect(result).toEqual(mockResult);
      expect(adminService.updateUserRole).toHaveBeenCalledWith('u1', 'admin', 'admin-123');
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockResult = {
        orders: [
          { id: 'o1', user_id: 'u1', total: 25, status: 'pending', created_at: '2026-01-01' },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      adminService.getOrders.mockResolvedValue(mockResult);

      const result = await controller.getOrders(
        { user: mockUser },
        { page: '1', limit: '20', status: 'pending' }
      );

      expect(result).toEqual(mockResult);
      expect(adminService.getOrders).toHaveBeenCalledWith('1', '20', 'pending');
    });

    it('should handle missing query params', async () => {
      adminService.getOrders.mockResolvedValue({
        orders: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

      await controller.getOrders({ user: mockUser }, {});

      expect(adminService.getOrders).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const mockResult = {
        message: 'Order status updated successfully',
        order: { id: 'o1', status: 'delivered', total: 25 },
      };
      adminService.updateOrderStatus.mockResolvedValue(mockResult);

      const result = await controller.updateOrderStatus(
        { user: mockUser },
        'o1',
        { status: 'delivered' }
      );

      expect(result).toEqual(mockResult);
      expect(adminService.updateOrderStatus).toHaveBeenCalledWith('o1', 'delivered');
    });
  });
});
