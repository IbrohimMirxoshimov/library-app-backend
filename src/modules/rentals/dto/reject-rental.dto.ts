import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { StockStatus } from '@prisma/client';

export class RejectRentalDto {
  @ApiProperty({ description: 'Rejection reason (required)' })
  @IsString()
  @IsNotEmpty()
  note: string;

  @ApiProperty({ description: 'New stock status', enum: StockStatus })
  @IsEnum(StockStatus)
  stockStatus: StockStatus;
}
