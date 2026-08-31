import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DollarRateService } from './dollar-rate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Dollar Rate')
@Controller('dollar-rate')
export class DollarRateController {
  constructor(private readonly dollarRateService: DollarRateService) {}

  @Get()
  @ApiOperation({ summary: 'Get current dollar rate' })
  @ApiResponse({ status: 200, description: 'Current rate' })
  async getCurrentRate() {
    return this.dollarRateService.getCurrentRate();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get rate history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Rate history' })
  async getRateHistory(@Query('limit') limit?: number) {
    return this.dollarRateService.getRateHistory(limit || 30);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update dollar rate (admin only)' })
  @ApiResponse({ status: 200, description: 'Rate updated' })
  async updateRate(@Body('rate') rate: number) {
    return this.dollarRateService.updateRate(rate, 'admin');
  }
}
