import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DevicesModule } from './modules/devices/devices.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { KitchenModule } from './modules/kitchen/kitchen.module';
import { PrintersModule } from './modules/printers/printers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { StockTransfersModule } from './modules/stock-transfers/stock-transfers.module';
import { InventoryCountsModule } from './modules/inventory-counts/inventory-counts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditModule } from './modules/audit/audit.module';
import { TablesModule } from './modules/tables/tables.module';
import { ExportModule } from './modules/export/export.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    DevicesModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    CustomersModule,
    InventoryModule,
    KitchenModule,
    PrintersModule,
    SuppliersModule,
    StockTransfersModule,
    InventoryCountsModule,
    ReportsModule,
    WebsocketModule,
    UploadsModule,
    AuditModule,
    TablesModule,
    ExportModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
