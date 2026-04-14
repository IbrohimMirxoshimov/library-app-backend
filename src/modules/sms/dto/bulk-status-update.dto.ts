import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsEnum } from 'class-validator';
import { SmsStatus } from '@prisma/client';

export class BulkStatusUpdateDto {
  @ApiProperty({ description: 'SMS IDs to update', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  ids: number[];

  @ApiProperty({ description: 'New SMS status', enum: SmsStatus })
  @IsEnum(SmsStatus)
  status: SmsStatus;
}
