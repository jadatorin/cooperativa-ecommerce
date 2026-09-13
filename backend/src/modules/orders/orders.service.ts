import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentReportFilter } from './dto/payment-report-filter.dto';

@Injectable()
export class OrdersService {
  constructor(
    private supabaseService: SupabaseService,
    private cartService: CartService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const cart = await this.cartService.getCart(userId);
    const supabase = this.supabaseService.getClient();

    if (!cart.items || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('app_orders')
      .insert({
        user_id: userId,
        total: cart.total,
        notes: createOrderDto.notes,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Error creating order: ${orderError.message}`);
    }

    // Create order items from cart items
    const orderItems = cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await supabase
      .from('app_order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Error creating order items: ${itemsError.message}`);
    }

    // Clear the cart
    await this.cartService.clearCart(userId);

    return {
      message: 'Order created successfully',
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
    };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const supabase = this.supabaseService.getClient();
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('app_orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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

  async findOne(userId: string, orderId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: order, error } = await supabase
      .from('app_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      throw new NotFoundException('Order not found');
    }

    // Extended: fetch items with product names via LEFT JOIN with app_products
    const { data: items } = await supabase
      .from('app_order_items')
      .select(`
        *,
        app_products(name)
      `)
      .eq('order_id', orderId);

    // Format items with product_name fallback for deleted products
    const formattedItems = (items || []).map((item: any) => ({
      product_name: item.app_products?.name || 'Producto eliminado',
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    return {
      ...order,
      items: formattedItems,
    };
  }

  async getPaymentReport(userId: string, filter: PaymentReportFilter) {
    const supabase = this.supabaseService.getClient();
    const { start_date, end_date, payment_method, payment_status, page = 1, limit = 20 } = filter;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('app_orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
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

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching payment report: ${error.message}`);
    }

    // Calculate summary statistics
    const { data: allOrders } = await supabase
      .from('app_orders')
      .select('total, subtotal, tax, payment_status, payment_method')
      .eq('user_id', userId)
      .gte('created_at', start_date || '1970-01-01')
      .lte('created_at', end_date || new Date().toISOString());

    const summary = {
      total_orders: count ?? 0,
      total_amount: (allOrders || []).reduce((sum, order) => sum + (order.total || 0), 0),
      total_subtotal: (allOrders || []).reduce((sum, order) => sum + (order.subtotal || 0), 0),
      total_tax: (allOrders || []).reduce((sum, order) => sum + (order.tax || 0), 0),
      paid_count: (allOrders || []).filter(o => o.payment_status === 'paid').length,
      paid_amount: (allOrders || []).filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total || 0), 0),
      pending_count: (allOrders || []).filter(o => o.payment_status === 'pending').length,
      pending_amount: (allOrders || []).filter(o => o.payment_status === 'pending').reduce((sum, o) => sum + (o.total || 0), 0),
    };

    return {
      payments: data,
      summary,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async updatePaymentStatus(orderId: string, userId: string, paymentStatus: string, paymentMethod?: string, paymentReference?: string) {
    const supabase = this.supabaseService.getClient();

    // Verify order belongs to user
    const { data: order, error: fetchError } = await supabase
      .from('app_orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      throw new NotFoundException('Order not found');
    }

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
