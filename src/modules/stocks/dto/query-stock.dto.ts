import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { StockStatus } from '@prisma/client';

export class QueryStockDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by library ID' })
  @IsOptional()
  @IsInt()
  libraryId?: number;

  @ApiPropertyOptional({ description: 'Filter by book ID' })
  @IsOptional()
  @IsInt()
  bookId?: number;

  @ApiPropertyOptional({ description: 'Filter by status', enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  status?: StockStatus;

  @ApiPropertyOptional({ description: 'Filter by busy status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ obj }) => {
    const val = obj.busy;
    if (val === 'false' || val === false) return false;
    if (val === 'true' || val === true) return true;
    return val;
  })
  busy?: boolean;
}
