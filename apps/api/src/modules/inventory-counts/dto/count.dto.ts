import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CountItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  systemQuantity!: number;

  @IsNumber()
  @IsOptional()
  actualQuantity?: number;
}

export class SubmitItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  actualQuantity!: number;
}

export class CreateCountDto {
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  productIds?: string[];
}

export class UpdateCountDto {
  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  items?: CountItemDto[];
}

export class SubmitCountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitItemDto)
  items!: SubmitItemDto[];
}
