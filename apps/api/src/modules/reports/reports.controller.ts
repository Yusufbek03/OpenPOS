import { Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  getDashboard(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getDashboard({ from, to, branchId });
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get sales by period' })
  @ApiQuery({ name: 'from' })
  @ApiQuery({ name: 'to' })
  @ApiQuery({ name: 'branchId', required: false })
  getSalesByPeriod(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getSalesByPeriod({ from, to, branchId });
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payments report' })
  @ApiQuery({ name: 'from' })
  @ApiQuery({ name: 'to' })
  @ApiQuery({ name: 'branchId', required: false })
  getPaymentsReport(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getPaymentsReport({ from, to, branchId });
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get inventory report' })
  getInventoryReport() {
    return this.reportsService.getInventoryReport();
  }

  @Post('clear-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all business data (OWNER only)' })
  clearAllData(@CurrentUser() user: JwtPayload) {
    return this.reportsService.clearAllData(user.sub);
  }
}
