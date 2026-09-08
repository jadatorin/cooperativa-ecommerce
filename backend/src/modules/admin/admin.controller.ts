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
import { PaymentExportQuery } from './dto/payment-export-query.dto';

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

  @Get('orders/:id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get order detail with items (admin only)' })
  @ApiResponse({ status: 200, description: 'Order detail' })
  async getOrderDetail(
    @Request() req: any,
    @Param('id') orderId: string,
  ) {
    return this.adminService.getOrderDetail(orderId);
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

  @Get('payments/report')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get payment report with filters (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment report with summary statistics' })
  async getPaymentReport(
    @Request() req: any,
    @Query() filter: PaymentExportQuery,
  ) {
    return this.adminService.getPaymentReport(filter);
  }

  @Get('payments/export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export payment report (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment report export' })
  async exportPaymentReport(
    @Request() req: any,
    @Query() filter: PaymentExportQuery,
  ) {
    return this.adminService.exportPaymentReport(filter);
  }

  @Put('orders/:id/payment')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order payment status (admin only)' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  async updateOrderPaymentStatus(
    @Request() req: any,
    @Param('id') orderId: string,
    @Body() body: { payment_status: string; payment_method?: string; payment_reference?: string },
  ) {
    return this.adminService.updateOrderPaymentStatus(
      orderId,
      body.payment_status,
      body.payment_method,
      body.payment_reference,
    );
  }
}