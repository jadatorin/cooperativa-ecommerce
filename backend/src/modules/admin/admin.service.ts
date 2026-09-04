import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabaseService: SupabaseService) {}

  async dashboard(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: _userData, error: userError, count: userCount } = await supabase
      .from('app_users')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      throw new Error(`Error counting users: ${userError.message}`);
    }

    const { data: _productData, error: productError, count: productCount } = await supabase
      .from('app_products')
      .select('*', { count: 'exact', head: true });

    if (productError) {
      throw new Error(`Error counting products: ${productError.message}`);
    }

    const { data: _orderData, error: orderError, count: orderCount } = await supabase
      .from('app_orders')
      .select('*', { count: 'exact', head: true });

    if (orderError) {
      throw new Error(`Error counting orders: ${orderError.message}`);
    }

    const { data: revenueData, error: revenueError } = await supabase
      .from('app_orders')
      .select('total')
      .eq('status', 'completed');

    if (revenueError) {
      throw new Error(`Error calculating revenue: ${revenueError.message}`);
    }

    const revenue = (revenueData as any[]).reduce(
      (acc: number, curr: any) => acc + (curr.total ?? 0),
      0,
    ) || 0;

    return {
      users: userCount ?? 0,
      products: productCount ?? 0,
      orders: orderCount ?? 0,
      revenue,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const supabase = this.supabaseService.getClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('app_users')
      .select('*', { count: 'exact' })
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

  async updateUserRole(userId: string, role: string) {
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
      .select('*', { count: 'exact' })
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