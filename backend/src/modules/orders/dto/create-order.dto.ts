import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiPropertyOptional({ example: 'Leave at the door' })
  @IsString()
  @IsOptional()
  notes?: string;
}
