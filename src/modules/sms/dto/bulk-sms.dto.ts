import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
} from 'class-validator';
import { SmsProvider } from '@prisma/client';

export class BulkSmsDto {
  @ApiProperty({ description: 'SMS text template', example: 'Kitob qaytarish muddati tugadi.' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    description: 'Specific phone numbers to send to (if empty, uses filter)',
    example: ['901234567', '901234568'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  @ApiPropertyOptional({
    description: 'Filter by user IDs',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[];

  @ApiPropertyOptional({
    description: 'SMS provider for bulk send',
    enum: SmsProvider,
    default: 'GATEWAY',
  })
  @IsOptional()
  @IsEnum(SmsProvider)
  provider?: SmsProvider;

  @ApiPropertyOptional({ description: 'Device ID for gateway sending' })
  @IsOptional()
  @IsInt()
  deviceId?: number;
}
