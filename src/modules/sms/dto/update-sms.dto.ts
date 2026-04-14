import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { SmsStatus } from '@prisma/client';

export class UpdateSmsDto {
  @ApiPropertyOptional({ description: 'SMS delivery status', enum: SmsStatus })
  @IsOptional()
  @IsEnum(SmsStatus)
  status?: SmsStatus;

  @ApiPropertyOptional({ description: 'Error reason if delivery failed' })
  @IsOptional()
  @IsString()
  errorReason?: string;
}
