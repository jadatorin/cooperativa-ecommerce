import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    private supabaseService: SupabaseService,
    private productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId: string) {
    const supabase = this.supabaseService.getClient();

    // Get active cart
    let { data: cart } = await supabase
      .from('app_carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Create if not exists
    if (!cart) {
      const { data: newCart } = await supabase
        .from('app_carts')
        .insert({ user_id: userId, status: 'active' })
        .select()
        .single();
      cart = newCart;
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const supabase = this.supabaseService.getClient();

    const { data: items } = await supabase
      .from('app_cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    const total = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

    return {
      id: cart.id,
      items: items || [],
      total,
      itemCount: items?.length || 0,
    };
  }

  /**
   * Get cart with product details enriched via a single batched query.
   * Eliminates N+1 queries: instead of one query per cart item,
   * collects all product IDs and fetches them in a single Supabase `in` query.
   */
  async getEnrichedCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const supabase = this.supabaseService.getClient();

    const { data: items } = await supabase
      .from('app_cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .order('created_at', { ascending: true });

    if (!items || items.length === 0) {
      return {
        id: cart.id,
        items: [],
        total: 0,
        itemCount: 0,
      };
    }

    // Batch: collect unique product IDs and fetch all in one query
    const productIds = [...new Set(items.map((item) => item.product_id))];

    const { data: products } = await supabase
      .from('app_products')
      .select('*')
      .in('id', productIds);

    // Build a lookup map for O(1) access
    const productMap = new Map<string, any>();
    for (const product of products || []) {
      productMap.set(product.id, product);
    }

    // Enrich cart items with product details (gracefully handle missing products)
    const enrichedItems = items.map((item) => ({
      ...item,
      product: productMap.get(item.product_id) || null,
    }));

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      items: enrichedItems,
      total,
      itemCount: items.length,
    };
  }

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productsService.findOne(addToCartDto.productId);
    const supabase = this.supabaseService.getClient();

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from('app_cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', addToCartDto.productId)
      .single();

    const quantity = addToCartDto.quantity || 1;
    const subtotal = product.price * quantity;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const newSubtotal = product.price * newQuantity;

      const { data } = await supabase
        .from('app_cart_items')
        .update({
          quantity: newQuantity,
          subtotal: newSubtotal,
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      await this.updateCartTotal(cart.id);
      return data;
    } else {
      // Add new item
      const { data } = await supabase
        .from('app_cart_items')
        .insert({
          cart_id: cart.id,
          product_id: addToCartDto.productId,
          quantity,
          unit_price: product.price,
          subtotal,
        })
        .select()
        .single();

      await this.updateCartTotal(cart.id);
      return data;
    }
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const supabase = this.supabaseService.getClient();

    if (quantity <= 0) {
      return this.removeItem(userId, itemId);
    }

    // Get item to calculate new subtotal
    const { data: item } = await supabase
      .from('app_cart_items')
      .select('*')
      .eq('id', itemId)
      .eq('cart_id', cart.id)
      .single();

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const subtotal = item.unit_price * quantity;

    const { data } = await supabase
      .from('app_cart_items')
      .update({ quantity, subtotal })
      .eq('id', itemId)
      .select()
      .single();

    await this.updateCartTotal(cart.id);
    return data;
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('app_cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cart.id);

    if (error) {
      throw new Error(`Error removing item: ${error.message}`);
    }

    await this.updateCartTotal(cart.id);
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('app_cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (error) {
      throw new Error(`Error clearing cart: ${error.message}`);
    }

    await supabase
      .from('app_carts')
      .update({ total: 0, updated_at: new Date().toISOString() })
      .eq('id', cart.id);

    return { message: 'Cart cleared' };
  }

  private async updateCartTotal(cartId: string) {
    const supabase = this.supabaseService.getClient();

    const { data: items } = await supabase
      .from('app_cart_items')
      .select('subtotal')
      .eq('cart_id', cartId);

    const total = items?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

    await supabase
      .from('app_carts')
      .update({ total, updated_at: new Date().toISOString() })
      .eq('id', cartId);
  }
}
