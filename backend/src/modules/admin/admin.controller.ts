import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
  Request,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async dashboard(@Request() req: any) {
    return this.adminService.dashboard(req.user.id);
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getUsers(@Request() req: any, @Query() query: any) {
    return this.adminService.getUsers(query.page, query.limit);
  }

  @Put('users/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUserRole(
    @Request() req: any,
    @Param('id') userId: string,
    @Body() roleDto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(userId, roleDto.role, req.user.id);
  }

  @Get('orders')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all orders with filters (admin only)' })
  @ApiResponse({ status: 200, description: 'Orders list' })
  async getOrders(@Request() req: any, @Query() query: any) {
    return this.adminService.getOrders(query.page, query.limit, query.status);
  }

  @Put('orders/:id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() statusDto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(orderId, statusDto.status);
  }
}