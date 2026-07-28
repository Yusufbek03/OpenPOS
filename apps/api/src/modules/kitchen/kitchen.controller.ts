import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { KitchenService } from './kitchen.service';
import { CreateStationDto, UpdateStationDto, UpdateTicketStatusDto } from './dto/station.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('kitchen')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kitchen')
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('stations')
  @ApiOperation({ summary: 'Get all kitchen stations' })
  findAllStations() {
    return this.kitchenService.findAllStations();
  }

  @Get('stations/:id')
  @ApiOperation({ summary: 'Get kitchen station by ID' })
  findStation(@Param('id') id: string) {
    return this.kitchenService.findStationById(id);
  }

  @Post('stations')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a kitchen station' })
  createStation(@Body() dto: CreateStationDto) {
    return this.kitchenService.createStation(dto);
  }

  @Patch('stations/:id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @ApiOperation({ summary: 'Update a kitchen station' })
  updateStation(@Param('id') id: string, @Body() dto: UpdateStationDto) {
    return this.kitchenService.updateStation(id, dto);
  }

  @Delete('stations/:id')
  @RequiredRoles('OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a kitchen station' })
  removeStation(@Param('id') id: string) {
    return this.kitchenService.removeStation(id);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get active kitchen tickets' })
  @ApiQuery({ name: 'stationId', required: false })
  getActiveTickets(@Query('stationId') stationId?: string) {
    return this.kitchenService.getActiveTickets(stationId);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update kitchen ticket status' })
  updateTicketStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.kitchenService.updateTicketStatus(id, dto.status);
  }
}
