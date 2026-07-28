import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockTransfersService } from './stock-transfers.service';
import { CreateTransferDto, UpdateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('stock-transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock-transfers')
export class StockTransfersController {
  constructor(private readonly stockTransfersService: StockTransfersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all stock transfers' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.stockTransfersService.findAll({ status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stock transfer by ID' })
  findOne(@Param('id') id: string) {
    return this.stockTransfersService.findById(id);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a stock transfer' })
  create(@Body() dto: CreateTransferDto) {
    return this.stockTransfersService.create(dto);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @ApiOperation({ summary: 'Update a stock transfer' })
  update(@Param('id') id: string, @Body() dto: UpdateTransferDto) {
    return this.stockTransfersService.update(id, dto);
  }

  @Post(':id/send')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send stock transfer' })
  send(@Param('id') id: string) {
    return this.stockTransfersService.send(id);
  }

  @Post(':id/receive')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive stock transfer' })
  receive(@Param('id') id: string, @Body() dto: ReceiveTransferDto) {
    return this.stockTransfersService.receive(id, dto);
  }

  @Post(':id/cancel')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel stock transfer' })
  cancel(@Param('id') id: string) {
    return this.stockTransfersService.cancel(id);
  }
}
