import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsEnum } from 'class-validator';
import { SmsStatus } from '@prisma/client';

export class UpdateSmsStatusDto {
  @ApiProperty({ description: 'SMS record ID', example: 123 })
  @IsInt()
  smsId: number;

  @ApiProperty({
    description: 'New SMS delivery status',
    enum: SmsStatus,
    example: 'DELIVERED',
  })
  @IsEnum(SmsStatus)
  status: SmsStatus;
}
