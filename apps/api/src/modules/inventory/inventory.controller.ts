import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'lowStock', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('lowStock') lowStock?: boolean,
  ) {
    return this.inventoryService.findAll({ page, limit, lowStock });
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get stock for a product' })
  getProductStock(@Param('productId') productId: string) {
    return this.inventoryService.getProductStock(productId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get stock movement history' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(
    @Query('productId') productId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getHistory({ productId, page, limit });
  }

  @Post('receive')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive goods' })
  receive(@Body() body: { productId: string; quantity: number; notes?: string }) {
    return this.inventoryService.receive(body);
  }

  @Post('writeoff')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write off goods' })
  writeOff(@Body() body: { productId: string; quantity: number; reason: string; notes?: string }) {
    return this.inventoryService.writeOff(body);
  }
}
