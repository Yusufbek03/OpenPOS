import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  printerId?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateStationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  printerId?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  isActive?: string;
}

export class UpdateTicketStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
}
