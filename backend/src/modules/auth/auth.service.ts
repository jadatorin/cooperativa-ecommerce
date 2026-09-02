import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Auth operations MUST use the anon key
    const authClient = this.supabaseService.getAuthClient();
    // Database operations use the service role key (bypasses RLS)
    const dbClient = this.supabaseService.getClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await (authClient.auth as any).signUp({
      email: registerDto.email,
      password: registerDto.password,
      options: {
        data: {
          full_name: registerDto.fullName,
          phone: registerDto.phone,
        },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new ConflictException('Email already registered');
      }
      throw new UnauthorizedException(authError.message);
    }

    // Create user profile in our table (service role bypasses RLS)
    const { error: profileError } = await dbClient
      .from('app_users')
      .insert({
        id: authData.user.id,
        email: registerDto.email,
        full_name: registerDto.fullName,
        phone: registerDto.phone,
        role: 'customer',
      });

    if (profileError) {
      this.logger.error(`Profile creation error: ${profileError.message}`, profileError.stack);
    }

    // Generate JWT
    const token = this.generateToken(authData.user.id, authData.user.email);

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: registerDto.fullName,
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    // Auth operations MUST use the anon key
    const authClient = this.supabaseService.getAuthClient();
    // Database operations use the service role key
    const dbClient = this.supabaseService.getClient();

    const { data, error } = await (authClient.auth as any).signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile (service role bypasses RLS)
    const { data: profile } = await dbClient
      .from('app_users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const token = this.generateToken(data.user.id, data.user.email);

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName: profile?.full_name,
        role: profile?.role,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new UnauthorizedException('User not found');
    }

    return data;
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getAuthClient();

    const { data, error } = await (supabase.auth as any).refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const token = this.generateToken(data.user.id, data.user.email);

    return { token };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}
