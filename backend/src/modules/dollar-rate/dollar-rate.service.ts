import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DollarRateService {
  constructor(private supabaseService: SupabaseService) {}

  async getCurrentRate() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_dollar_rates')
      .select('*')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // Return default rate if none exists
      return {
        rate: 1,
        source: 'default',
        effective_date: new Date().toISOString(),
      };
    }

    return data;
  }

  async updateRate(rate: number, source = 'manual') {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_dollar_rates')
      .upsert(
        {
          rate,
          source,
          effective_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'effective_date,source' },
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating rate: ${error.message}`);
    }

    return data;
  }

  async getRateHistory(limit = 30) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_dollar_rates')
      .select('*')
      .order('effective_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching rate history: ${error.message}`);
    }

    return data;
  }
}
