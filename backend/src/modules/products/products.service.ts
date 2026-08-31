import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(page = 1, limit = 18, category?: string, search?: string) {
    const supabase = this.supabaseService.getClient();
    const offset = (page - 1) * limit;

    let query = supabase
      .from('app_products')
      .select('*', { count: 'exact' })
      .eq('is_available', true)
      .order('name', { ascending: true });

    if (category) {
      query = query.eq('category_slug', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }

    return {
      products: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };
  }

  async findOne(id: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return data;
  }

  async findByBarcode(barcode: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return data;
  }

  async create(createProductDto: CreateProductDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_products')
      .insert(createProductDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_products')
      .update(updateProductDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }

    return data;
  }

  async remove(id: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('app_products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }

    return { message: 'Product deleted successfully' };
  }
}
