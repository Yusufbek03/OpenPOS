import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['POS', 'KITCHEN', 'DISPLAY', 'PRINTER', 'ADMIN'])
  type!: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdateDeviceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
