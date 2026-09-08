import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaymentReportFilter } from './dto/payment-report-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders list' })
  async findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findAll(req.user.id, page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.id, id);
  }

  @Get('payments/report')
  @ApiOperation({ summary: 'Get payment report for user' })
  @ApiResponse({ status: 200, description: 'Payment report with summary statistics' })
  async getPaymentReport(
    @Request() req: any,
    @Query() filter: PaymentReportFilter,
  ) {
    return this.ordersService.getPaymentReport(req.user.id, filter);
  }

  @Put(':id/payment')
  @ApiOperation({ summary: 'Update payment status for an order' })
  @ApiResponse({ status: 200, description: 'Payment status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updatePaymentStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { payment_status: string; payment_method?: string; payment_reference?: string },
  ) {
    return this.ordersService.updatePaymentStatus(
      id,
      req.user.id,
      body.payment_status,
      body.payment_method,
      body.payment_reference,
    );
  }
}
