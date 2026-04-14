import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReturnRentalDto {
  @ApiPropertyOptional({ description: 'Return note' })
  @IsOptional()
  @IsString()
  note?: string;
}
