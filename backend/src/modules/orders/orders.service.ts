import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CartService } from '../cart/cart.service';
import { CreateOrderDto } from './dto/create-order.dto';

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
}
