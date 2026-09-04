import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  async dashboard(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Run independent queries in parallel for performance
    const [
      { data: _userData, error: userError, count: userCount },
      { data: _productData, error: productError, count: productCount },
      { data: _orderData, error: orderError, count: orderCount },
      { data: revenue, error: revenueError },
    ] = await Promise.all([
      supabase
        .from('app_users')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('app_products')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('app_orders')
        .select('id', { count: 'exact', head: true }),
      supabase.rpc('calculate_revenue'),
    ]);

    if (userError) {
      throw new Error(`Error counting users: ${userError.message}`);
    }
    if (productError) {
      throw new Error(`Error counting products: ${productError.message}`);
    }
    if (orderError) {
      throw new Error(`Error counting orders: ${orderError.message}`);
    }
    if (revenueError) {
      throw new Error(`Error calculating revenue: ${revenueError.message}`);
    }

    return {
      users: userCount ?? 0,
      products: productCount ?? 0,
      orders: orderCount ?? 0,
      revenue: Number(revenue) || 0,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const supabase = this.supabaseService.getClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('app_users')
      .select('id, email, full_name, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return {
      users: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async updateUserRole(userId: string, role: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new ForbiddenException('Admin cannot change their own role');
    }

    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('app_users')
      .update({ role })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error updating user role: ${error.message}`);
    }

    return { message: 'User role updated successfully', userId, role };
  }

  async getOrders(page = 1, limit = 20, status?: string) {
    const supabase = this.supabaseService.getClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('app_orders')
      .select('id, user_id, total, status, created_at, order_number', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`);
    }

    return {
      orders: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, status: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }

    return { message: 'Order status updated successfully', order: data };
  }
}
