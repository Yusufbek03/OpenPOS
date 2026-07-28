import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all devices' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('branchId') branchId?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.devicesService.findAll({ branchId, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get device by code' })
  findByCode(@Param('code') code: string) {
    return this.devicesService.findByCode(code);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a device' })
  create(@Body() dto: CreateDeviceDto) {
    return this.devicesService.create(dto);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Update a device' })
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.devicesService.update(id, dto);
  }

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Device heartbeat' })
  heartbeat(@Param('id') id: string) {
    return this.devicesService.heartbeat(id);
  }

  @Delete(':id')
  @RequiredRoles('OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a device' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
