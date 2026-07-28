import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import type { UserRole } from '@openpos/shared';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'john' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiProperty({ enum: ['OWNER', 'ADMINISTRATOR', 'CASHIER', 'WAITER', 'COOK', 'WAREHOUSE_MANAGER', 'ACCOUNTANT'] })
  @IsString()
  @IsNotEmpty()
  role!: UserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  branchId?: string;
}
