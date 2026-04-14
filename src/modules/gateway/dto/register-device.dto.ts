import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RegisterDeviceDto {
  @ApiPropertyOptional({ description: 'Device brand', example: 'Samsung' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Device model', example: 'Galaxy S21' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Android build ID', example: 'SP1A.210812.016' })
  @IsOptional()
  @IsString()
  buildId?: string;

  @ApiProperty({
    description: 'Firebase Cloud Messaging token for push notifications',
    example: 'fcm_token_string_here',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
