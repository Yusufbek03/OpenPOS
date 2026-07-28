import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto, UpdateTableDto, UpdateTableStatusDto } from './dto/table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'zone', required: false })
  findAll(@Query('status') status?: string, @Query('zone') zone?: string) {
    return this.tablesService.findAll({ status, zone });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get table statistics' })
  getStats() {
    return this.tablesService.getStats();
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get table zones' })
  getZones() {
    return this.tablesService.getZones();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table by ID' })
  findOne(@Param('id') id: string) {
    return this.tablesService.findById(id);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a table' })
  create(@Body() dto: CreateTableDto, @CurrentUser() user: any) {
    return this.tablesService.create(dto, user.branchId);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Update a table' })
  update(@Param('id') id: string, @Body() dto: UpdateTableDto) {
    return this.tablesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update table status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTableStatusDto) {
    return this.tablesService.updateStatus(id, dto);
  }

  @Delete(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a table' })
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
