import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Gender, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Phone (9 digits)' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Extra phone numbers' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extraPhones?: string[];

  @ApiPropertyOptional({ description: 'Gender', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'Password' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'Verified status' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiPropertyOptional({ description: 'Phone verified' })
  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @ApiPropertyOptional({ description: 'Status', enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ description: 'Balance' })
  @IsOptional()
  @IsInt()
  balance?: number;

  @ApiPropertyOptional({ description: 'Blocking reason' })
  @IsOptional()
  @IsString()
  blockingReason?: string;

  @ApiPropertyOptional({ description: 'Role ID' })
  @IsOptional()
  @IsInt()
  roleId?: number;

  @ApiPropertyOptional({ description: 'Library ID (for admin)' })
  @IsOptional()
  @IsInt()
  adminLibraryId?: number;

  @ApiPropertyOptional({ description: 'Address ID' })
  @IsOptional()
  @IsInt()
  addressId?: number;

  @ApiPropertyOptional({ description: 'Telegram ID' })
  @IsOptional()
  @IsString()
  telegramId?: string;
}
