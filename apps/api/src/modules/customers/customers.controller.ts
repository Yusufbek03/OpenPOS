import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto, BonusOperationDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequiredRoles } from '../auth/decorators/roles.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll({ page, limit, search, status });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get customer statistics' })
  getStats() {
    return this.customersService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Post()
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'CASHIER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a customer' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'CASHIER')
  @ApiOperation({ summary: 'Update a customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/bonus/accrue')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'CASHIER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accrue bonus points' })
  accrueBonus(@Param('id') id: string, @Body() dto: BonusOperationDto) {
    return this.customersService.accrueBonus(id, dto.amount);
  }

  @Post(':id/bonus/writeoff')
  @RequiredRoles('OWNER', 'ADMINISTRATOR', 'CASHIER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Write off bonus points' })
  writeOffBonus(@Param('id') id: string, @Body() dto: BonusOperationDto) {
    return this.customersService.writeOffBonus(id, dto.amount);
  }

  @Delete(':id')
  @RequiredRoles('OWNER', 'ADMINISTRATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
