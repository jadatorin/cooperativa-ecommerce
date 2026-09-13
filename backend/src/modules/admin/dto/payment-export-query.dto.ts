import { IsOptional, IsIn, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentExportQuery {
  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({ enum: ['cash', 'card', 'transfer', 'mobile', 'other'] })
  @IsIn(['cash', 'card', 'transfer', 'mobile', 'other'])
  @IsOptional()
  payment_method?: string;

  @ApiPropertyOptional({ enum: ['pending', 'paid', 'partial', 'refunded', 'failed'] })
  @IsIn(['pending', 'paid', 'partial', 'refunded', 'failed'])
  @IsOptional()
  payment_status?: string;

  @ApiPropertyOptional({ example: 'pending' })
  @IsString()
  @IsOptional()
  order_status?: string;

  @ApiPropertyOptional({ example: '1042' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: ['csv', 'json'], default: 'csv' })
  @IsIn(['csv', 'json'])
  @IsOptional()
  format?: 'csv' | 'json';
}
