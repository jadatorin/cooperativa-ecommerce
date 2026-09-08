import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PaymentExportQuery } from './dto/payment-export-query.dto';

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
      { data: revenueOrders, error: revenueError },
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
      supabase
        .from('app_orders')
        .select('total')
        .eq('status', 'delivered'),
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
      revenue: (revenueOrders || []).reduce((sum, order) => sum + (order.total || 0), 0),
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

  async getOrderDetail(orderId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: order, error } = await supabase
      .from('app_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      throw new NotFoundException('Order not found');
    }

    // Fetch items with product names
    const { data: items } = await supabase
      .from('app_order_items')
      .select(`
        *,
        app_products(name)
      `)
      .eq('order_id', orderId);

    const formattedItems = (items || []).map((item: any) => ({
      product_name: item.app_products?.name || 'Producto eliminado',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    return {
      ...order,
      date: order.created_at,
      items: formattedItems,
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

  async getPaymentReport(filter: PaymentExportQuery) {
    const supabase = this.supabaseService.getClient();
    const { start_date, end_date, payment_method, payment_status, order_status, search, page = 1, limit = 20 } = filter;
    const offset = ((page || 1) - 1) * (limit || 20);

    let query = supabase
      .from('app_orders')
      .select('*, app_users(email, full_name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    if (payment_method) {
      query = query.eq('payment_method', payment_method);
    }
    if (payment_status) {
      query = query.eq('payment_status', payment_status);
    }
    if (order_status) {
      query = query.eq('status', order_status);
    }
    if (search) {
      // Search by order number or user email
      query = query.or(`order_number.eq.${search},app_users.email.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + (limit || 20) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching payment report: ${error.message}`);
    }

    // Calculate summary statistics from filtered results
    const totalAmount = (data || []).reduce((sum, order) => sum + (order.total || 0), 0);
    const totalSubtotal = (data || []).reduce((sum, order) => sum + (order.subtotal || 0), 0);
    const totalTax = (data || []).reduce((sum, order) => sum + (order.tax || 0), 0);
    const paidOrders = (data || []).filter(o => o.payment_status === 'paid');
    const pendingOrders = (data || []).filter(o => o.payment_status === 'pending');

    return {
      orders: data,
      summary: {
        total_orders: count ?? 0,
        total_amount: totalAmount,
        total_subtotal: totalSubtotal,
        total_tax: totalTax,
        paid_count: paidOrders.length,
        paid_amount: paidOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        pending_count: pendingOrders.length,
        pending_amount: pendingOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      },
      pagination: {
        page: page || 1,
        limit: limit || 20,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / (limit || 20)),
      },
    };
  }

  async exportPaymentReport(filter: PaymentExportQuery) {
    const report = await this.getPaymentReport(filter);
    const format = filter.format || 'csv';

    if (format === 'json') {
      return {
        data: report.orders,
        summary: report.summary,
      };
    }

    // CSV format
    const headers = [
      'Order Number',
      'User Email',
      'User Name',
      'Date',
      'Total',
      'Subtotal',
      'Tax',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Paid At',
    ];

    const rows = (report.orders || []).map((order: any) => [
      order.order_number,
      order.app_users?.email || '',
      order.app_users?.full_name || '',
      order.created_at,
      order.total,
      order.subtotal || 0,
      order.tax || 0,
      order.payment_method || '',
      order.payment_status || '',
      order.status || '',
      order.paid_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      csv: csvContent,
      summary: report.summary,
    };
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentMethod?: string, paymentReference?: string) {
    const supabase = this.supabaseService.getClient();

    const updateData: any = {
      payment_status: paymentStatus,
      payment_date: new Date().toISOString(),
    };

    if (paymentMethod) {
      updateData.payment_method = paymentMethod;
    }

    if (paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    const { data, error } = await supabase
      .from('app_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }

    return { message: 'Payment status updated successfully', order: data };
  }
}
