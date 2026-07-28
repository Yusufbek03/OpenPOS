import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryCountsService } from './inventory-counts.service';
import { CreateCountDto, UpdateCountDto, SubmitCountDto } from './dto/count.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('inventory-counts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-counts')
export class InventoryCountsController {
  constructor(private readonly inventoryCountsService: InventoryCountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inventory counts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('status') status?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.inventoryCountsService.findAll({ status, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory count by ID' })
  findOne(@Param('id') id: string) {
    return this.inventoryCountsService.findById(id);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an inventory count' })
  create(@Body() dto: CreateCountDto) {
    return this.inventoryCountsService.create(dto);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @ApiOperation({ summary: 'Update an inventory count' })
  update(@Param('id') id: string, @Body() dto: UpdateCountDto) {
    return this.inventoryCountsService.update(id, dto);
  }

  @Post(':id/submit')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'WAREHOUSE_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit inventory count' })
  submit(@Param('id') id: string, @Body() dto: SubmitCountDto) {
    return this.inventoryCountsService.submit(id, dto);
  }

  @Post(':id/cancel')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel inventory count' })
  cancel(@Param('id') id: string) {
    return this.inventoryCountsService.cancel(id);
  }
}
