import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { ForbiddenException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let supabaseService: jest.Mocked<SupabaseService>;
  let mockSupabaseClient: Record<string, any>;

  function createMockClient() {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
    };
  }

  /** Create a thenable that resolves to `result` and also has an `eq` chainable. */
  function makeThenable(result: any) {
    const eq = jest.fn().mockResolvedValue(result);
    return {
      eq,
      then(onFulfilled?: any, onRejected?: any) {
        return Promise.resolve(result).then(onFulfilled, onRejected);
      },
    };
  }

  beforeEach(async () => {
    mockSupabaseClient = createMockClient();

    supabaseService = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: SupabaseService, useValue: supabaseService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('dashboard', () => {
    it('should return dashboard stats with counts and revenue', async () => {
      // Promise.all runs 4 queries in parallel: 3 count queries + 1 rpc
      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: null, error: null, count: 10 })
        .mockResolvedValueOnce({ data: null, error: null, count: 25 })
        .mockResolvedValueOnce({ data: null, error: null, count: 50 });

      mockSupabaseClient.rpc.mockResolvedValue({ data: 300, error: null });

      const result = await service.dashboard('user-123');

      expect(result).toEqual({
        users: 10,
        products: 25,
        orders: 50,
        revenue: 300,
      });
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('calculate_revenue');
    });

    it('should handle empty revenue data', async () => {
      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: null, error: null, count: 5 })
        .mockResolvedValueOnce({ data: null, error: null, count: 10 })
        .mockResolvedValueOnce({ data: null, error: null, count: 3 });

      mockSupabaseClient.rpc.mockResolvedValue({ data: 0, error: null });

      const result = await service.dashboard('user-123');

      expect(result.revenue).toBe(0);
    });

    it('should throw error on user count failure', async () => {
      mockSupabaseClient.select
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Connection refused' },
          count: null,
        })
        .mockResolvedValueOnce({ data: null, error: null, count: 25 })
        .mockResolvedValueOnce({ data: null, error: null, count: 50 });

      mockSupabaseClient.rpc.mockResolvedValue({ data: 0, error: null });

      await expect(service.dashboard('user-123')).rejects.toThrow(
        'Error counting users: Connection refused'
      );
    });

    it('should throw error on product count failure', async () => {
      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: null, error: null, count: 5 })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Table not found' },
          count: null,
        })
        .mockResolvedValueOnce({ data: null, error: null, count: 3 });

      mockSupabaseClient.rpc.mockResolvedValue({ data: 0, error: null });

      await expect(service.dashboard('user-123')).rejects.toThrow(
        'Error counting products: Table not found'
      );
    });

    it('should throw error on revenue calculation failure', async () => {
      mockSupabaseClient.select
        .mockResolvedValueOnce({ data: null, error: null, count: 5 })
        .mockResolvedValueOnce({ data: null, error: null, count: 10 })
        .mockResolvedValueOnce({ data: null, error: null, count: 3 });

      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

      await expect(service.dashboard('user-123')).rejects.toThrow(
        'Error calculating revenue: Query failed'
      );
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: 'u1', email: 'a@test.com', full_name: 'User A', role: 'user', created_at: '2026-01-01' },
        { id: 'u2', email: 'b@test.com', full_name: 'User B', role: 'admin', created_at: '2026-01-02' },
      ];

      mockSupabaseClient.range.mockResolvedValue({
        data: mockUsers,
        error: null,
        count: 2,
      });

      const result = await service.getUsers(1, 20);

      expect(result.users).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should use default pagination values', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      });

      const result = await service.getUsers();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should calculate totalPages correctly', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [],
        error: null,
        count: 45,
      });

      const result = await service.getUsers(1, 20);

      expect(result.pagination.totalPages).toBe(3);
    });

    it('should throw error on database failure', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      });

      await expect(service.getUsers()).rejects.toThrow(
        'Error fetching users: Database error'
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ error: null });

      const result = await service.updateUserRole('user-456', 'admin', 'admin-123');

      expect(result).toEqual({
        message: 'User role updated successfully',
        userId: 'user-456',
        role: 'admin',
      });
    });

    it('should prevent self-demotion', async () => {
      await expect(
        service.updateUserRole('admin-123', 'user', 'admin-123')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with correct message for self-demotion', async () => {
      try {
        await service.updateUserRole('admin-123', 'user', 'admin-123');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe('Admin cannot change their own role');
      }
    });

    it('should throw error on update failure', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ error: { message: 'Update failed' } });

      await expect(
        service.updateUserRole('user-456', 'admin', 'admin-123')
      ).rejects.toThrow('Error updating user role: Update failed');
    });
  });

  describe('getOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 'o1', user_id: 'u1', total: 25.5, status: 'pending', created_at: '2026-01-01' },
        { id: 'o2', user_id: 'u2', total: 50, status: 'delivered', created_at: '2026-01-02' },
      ];

      const thenable = makeThenable({ data: mockOrders, error: null, count: 2 });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.getOrders(1, 20);

      expect(result.orders).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });

    it('should filter by status when provided', async () => {
      const thenable = makeThenable({ data: [], error: null, count: 0 });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await service.getOrders(1, 20, 'delivered');

      expect(thenable.eq).toHaveBeenCalledWith('status', 'delivered');
    });

    it('should not call eq when status is not provided', async () => {
      const thenable = makeThenable({ data: [], error: null, count: 0 });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await service.getOrders(1, 20);

      expect(thenable.eq).not.toHaveBeenCalled();
    });

    it('should use default pagination', async () => {
      const thenable = makeThenable({ data: [], error: null, count: 0 });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      const result = await service.getOrders();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should throw error on database failure', async () => {
      const thenable = makeThenable({ data: null, error: { message: 'Query failed' }, count: null });
      mockSupabaseClient.range.mockReturnValueOnce(thenable);

      await expect(service.getOrders()).rejects.toThrow(
        'Error fetching orders: Query failed'
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = { id: 'o1', status: 'delivered', total: 25.5 };
      mockSupabaseClient.single.mockResolvedValue({
        data: mockOrder,
        error: null,
      });

      const result = await service.updateOrderStatus('o1', 'delivered');

      expect(result.message).toBe('Order status updated successfully');
      expect(result.order).toEqual(mockOrder);
    });

    it('should throw error on update failure', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Order not found' },
      });

      await expect(
        service.updateOrderStatus('nonexistent', 'delivered')
      ).rejects.toThrow('Error updating order status: Order not found');
    });
  });
});
