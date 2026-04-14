import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '@prisma/client';
import { CreatePassportNestedDto } from './create-passport-nested.dto';

export class CreateUserDto {
  @ApiProperty({ description: 'First name', example: 'Ibrohim' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Mirxoshimov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ description: 'Username for admin login' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Phone (9 digits)', example: '901234567' })
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

  @ApiProperty({ description: 'Passport data', type: CreatePassportNestedDto })
  @ValidateNested()
  @Type(() => CreatePassportNestedDto)
  passport: CreatePassportNestedDto;
}
