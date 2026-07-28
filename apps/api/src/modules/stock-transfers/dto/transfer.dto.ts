import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class TransferItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  quantity!: number;
}

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  fromWarehouseId!: string;

  @IsString()
  @IsNotEmpty()
  toWarehouseId!: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class UpdateTransferDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items?: TransferItemDto[];
}

export class ReceiveItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  receivedQuantity!: number;
}

export class ReceiveTransferDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];
}
