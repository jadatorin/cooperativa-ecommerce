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
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async dashboard(@Request() req: any) {
    return this.adminService.dashboard(req.user.id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users list' })
  async getUsers(@Request() req: any, @Query() query: any) {
    return this.adminService.getUsers(query.page, query.limit);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUserRole(
    @Request() req: any,
    @Param('id') userId: string,
    @Body() roleDto: { role: string },
  ) {
    return this.adminService.updateUserRole(userId, roleDto.role);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all orders with filters (admin only)' })
  @ApiResponse({ status: 200, description: 'Orders list' })
  async getOrders(@Request() req: any, @Query() query: any) {
    return this.adminService.getOrders(query.page, query.limit, query.status);
  }

  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateOrderStatus(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() statusDto: { status: string },
  ) {
    return this.adminService.updateOrderStatus(orderId, statusDto.status);
  }
}