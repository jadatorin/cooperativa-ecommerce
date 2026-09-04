import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['user', 'admin'], example: 'user' })
  @IsIn(['user', 'admin'])
  role: 'user' | 'admin';
}
