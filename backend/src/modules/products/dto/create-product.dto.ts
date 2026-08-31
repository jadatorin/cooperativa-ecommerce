import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Arroz 1kg' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '7591234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 'Arroz premium de alta calidad' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2.50 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({ example: ['arroz', 'granos', 'basicos'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: 'basicos' })
  @IsString()
  @IsOptional()
  category_slug?: string;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  quantity_stock?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  weight_sold?: boolean;
}
