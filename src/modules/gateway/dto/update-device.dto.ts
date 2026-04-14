import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: 'Device brand', example: 'Samsung' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Device model', example: 'Galaxy S21' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Android build ID' })
  @IsOptional()
  @IsString()
  buildId?: string;

  @ApiPropertyOptional({ description: 'Firebase Cloud Messaging token' })
  @IsOptional()
  @IsString()
  fcmToken?: string;

  @ApiPropertyOptional({ description: 'Whether device is active for SMS sending' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
