import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('export')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('orders/csv')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'status', required: false })
  ordersCsv(@Res() res: Response, @Query('from') from?: string, @Query('to') to?: string, @Query('status') status?: string) {
    return this.exportService.ordersCsv(res, { from, to, status });
  }

  @Get('orders/excel')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Export orders as Excel' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'status', required: false })
  ordersExcel(@Res() res: Response, @Query('from') from?: string, @Query('to') to?: string, @Query('status') status?: string) {
    return this.exportService.ordersExcel(res, { from, to, status });
  }

  @Get('sales/csv')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Export sales by product as CSV' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  salesCsv(@Res() res: Response, @Query('from') from?: string, @Query('to') to?: string) {
    return this.exportService.salesCsv(res, { from, to });
  }

  @Get('sales/excel')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Export sales by product as Excel' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  salesExcel(@Res() res: Response, @Query('from') from?: string, @Query('to') to?: string) {
    return this.exportService.salesExcel(res, { from, to });
  }
}
