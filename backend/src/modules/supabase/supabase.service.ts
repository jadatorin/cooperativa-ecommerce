import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAnon: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    // Client with service role for database admin operations
    this.supabase = createClient(supabaseUrl, serviceRoleKey);

    // Client with anon key for auth operations (signUp, signIn, etc.)
    if (anonKey) {
      this.supabaseAnon = createClient(supabaseUrl, anonKey);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Client with anon key for Supabase Auth operations (register, login, etc.)
   * Auth operations MUST use the anon key, not service role
   */
  getAuthClient(): SupabaseClient {
    return this.supabaseAnon || this.supabase;
  }

  /**
   * Create a client with user's JWT for Row Level Security
   */
  getClientWithAuth(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;

    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });
  }
}
