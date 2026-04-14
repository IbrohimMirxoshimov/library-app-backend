import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsString, IsNotEmpty } from 'class-validator';
import { StockStatus, StockCondition } from '@prisma/client';

export class UpdateStockDto {
  @ApiPropertyOptional({ description: 'Stock status', enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  status?: StockStatus;

  @ApiPropertyOptional({ description: 'Book edition ID' })
  @IsOptional()
  @IsInt()
  bookEditionId?: number;

  @ApiPropertyOptional({ description: 'Book rule ID' })
  @IsOptional()
  @IsInt()
  bookRuleId?: number;

  @ApiPropertyOptional({ description: 'Physical condition', enum: StockCondition })
  @IsOptional()
  @IsEnum(StockCondition)
  condition?: StockCondition;

  @ApiPropertyOptional({ description: 'Source user ID' })
  @IsOptional()
  @IsInt()
  sourceId?: number;

  @ApiPropertyOptional({ description: 'Comment (required if condition is not NEW)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
