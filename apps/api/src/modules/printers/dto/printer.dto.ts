import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreatePrinterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsNumber()
  @IsOptional()
  paperWidth?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePrinterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsString()
  @IsOptional()
  department?: string;

  @IsNumber()
  @IsOptional()
  paperWidth?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreatePrintJobDto {
  @IsString()
  @IsNotEmpty()
  printerId!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  data!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  userId?: string;
}
