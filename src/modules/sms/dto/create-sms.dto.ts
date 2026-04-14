import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Length } from 'class-validator';
import { SmsProvider } from '@prisma/client';

export class CreateSmsDto {
  @ApiProperty({
    description: 'Recipient phone number (9 digits without +998 prefix)',
    example: '901234567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak' })
  phone: string;

  @ApiProperty({ description: 'SMS text content', example: 'Assalomu alaykum!' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'User ID this SMS is related to' })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({
    description: 'SMS provider',
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
