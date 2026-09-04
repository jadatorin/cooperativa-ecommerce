import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'],
    example: 'pending',
  })
  @IsIn(['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'])
  status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled';
}
