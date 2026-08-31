import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const supabase = this.supabaseService.getClient();

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
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

    // Create user profile in our table
    const { error: profileError } = await supabase
      .from('app_users')
      .insert({
        id: authData.user.id,
        email: registerDto.email,
        full_name: registerDto.fullName,
        phone: registerDto.phone,
        role: 'customer',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
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
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user profile
    const { data: profile } = await supabase
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
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.refreshSession({
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
