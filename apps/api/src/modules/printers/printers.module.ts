import { Module } from '@nestjs/common';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { PrintService } from './print.service';

@Module({
  controllers: [PrintersController],
  providers: [PrintersService, PrintService],
  exports: [PrintersService, PrintService],
})
export class PrintersModule {}
