import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { StockCondition } from '@prisma/client';

export class CreateStockDto {
  @ApiProperty({ description: 'Book ID' })
  @IsInt()
  bookId: number;

  @ApiPropertyOptional({ description: 'Book edition ID' })
  @IsOptional()
  @IsInt()
  bookEditionId?: number;

  @ApiPropertyOptional({ description: 'Physical condition', enum: StockCondition })
  @IsOptional()
  @IsEnum(StockCondition)
  condition?: StockCondition;

  @ApiPropertyOptional({ description: 'Source user ID (who donated/provided)' })
  @IsOptional()
  @IsInt()
  sourceId?: number;

  @ApiPropertyOptional({ description: 'Comment (required if condition is not NEW)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  comment?: string;
}
