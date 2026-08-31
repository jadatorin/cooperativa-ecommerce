import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FavoritesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching favorites: ${error.message}`);
    }

    return data;
  }

  async add(userId: string, productId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_favorites')
      .insert({ user_id: userId, product_id: productId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { message: 'Product already in favorites' };
      }
      throw new Error(`Error adding favorite: ${error.message}`);
    }

    return { message: 'Product added to favorites', favorite: data };
  }

  async remove(userId: string, productId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('app_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      throw new Error(`Error removing favorite: ${error.message}`);
    }

    return { message: 'Product removed from favorites' };
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('app_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return !!data;
  }
}
