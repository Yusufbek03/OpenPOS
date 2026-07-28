import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll({ page, limit, status, search });
  }

  @Get('open')
  @ApiOperation({ summary: 'Count open orders (cannot close register with open orders)' })
  countOpen() {
    return this.ordersService.countOpenOrders();
  }

  @Get('open/list')
  @ApiOperation({ summary: 'List all open orders' })
  listOpen() {
    return this.ordersService.findOpenOrders();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an order' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: JwtPayload) {
    const branchId = user.branchId ?? 'default-branch';
    return this.ordersService.create({ ...dto, cashierId: dto.cashierId ?? user.sub }, branchId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  @Post(':id/send-to-kitchen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send order to kitchen' })
  sendToKitchen(@Param('id') id: string) {
    return this.ordersService.sendToKitchen(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return an order (refund + restore inventory)' })
  returnOrder(@Param('id') id: string, @Body() body: { reason?: string }, @CurrentUser() user: JwtPayload) {
    return this.ordersService.returnOrder(id, user.sub, body.reason);
  }
}
