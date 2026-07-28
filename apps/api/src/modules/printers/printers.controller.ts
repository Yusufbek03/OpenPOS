import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PrintersService } from './printers.service';
import { PrintService } from './print.service';
import { CreatePrinterDto, UpdatePrinterDto, CreatePrintJobDto } from './dto/printer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types';

@ApiTags('printers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('printers')
export class PrintersController {
  constructor(
    private readonly printersService: PrintersService,
    private readonly printService: PrintService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all printers' })
  @ApiQuery({ name: 'department', required: false })
  findAll(@Query('department') department?: string) {
    return this.printersService.findAll({ department });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get printer by ID' })
  findOne(@Param('id') id: string) {
    return this.printersService.findById(id);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a printer' })
  create(@Body() dto: CreatePrinterDto) {
    return this.printersService.create(dto);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Update a printer' })
  update(@Param('id') id: string, @Body() dto: UpdatePrinterDto) {
    return this.printersService.update(id, dto);
  }

  @Delete(':id')
  @RequiredRoles('OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a printer' })
  remove(@Param('id') id: string) {
    return this.printersService.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test printer connection' })
  async testPrinter(@Param('id') id: string) {
    const connected = await this.printService.testPrinter(id);
    return { connected, message: connected ? 'Принтер доступен' : 'Принтер недоступен' };
  }

  @Post('print-receipt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Print receipt for an order' })
  async printReceipt(@Body() body: { orderId: string; printerId: string }) {
    const success = await this.printService.printReceipt(body.orderId, body.printerId);
    return { success, message: success ? 'Чек напечатан' : 'Ошибка печати' };
  }

  @Post('print-kitchen-ticket')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Print kitchen ticket' })
  async printKitchenTicket(@Body() body: { orderId: string; stationId: string; printerId?: string }) {
    const success = await this.printService.printKitchenTicket(body.orderId, body.stationId, body.printerId);
    return { success, message: success ? 'Талон напечатан' : 'Ошибка печати' };
  }

  @Get('jobs/list')
  @ApiOperation({ summary: 'Get print jobs' })
  @ApiQuery({ name: 'printerId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getPrintJobs(
    @Query('printerId') printerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.printersService.getPrintJobs({ printerId, status, page, limit });
  }

  @Post('jobs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a print job' })
  createPrintJob(@Body() dto: CreatePrintJobDto, @CurrentUser() user: JwtPayload) {
    return this.printersService.createPrintJob({ ...dto, userId: user.sub });
  }

  @Patch('jobs/:id/status')
  @ApiOperation({ summary: 'Update print job status' })
  updateJobStatus(
    @Param('id') id: string,
    @Body() body: { status: 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'; error?: string },
  ) {
    return this.printersService.updatePrintJobStatus(id, body.status, body.error);
  }
}
