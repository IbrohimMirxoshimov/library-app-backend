import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class StatsByRangeDto {
  @ApiProperty({ description: 'Start date', example: '2026-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2026-03-31' })
  @IsDateString()
  endDate: string;
}
