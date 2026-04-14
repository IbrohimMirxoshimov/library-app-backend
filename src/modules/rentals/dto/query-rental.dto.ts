import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryRentalDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by library ID' })
  @IsOptional()
  @IsInt()
  libraryId?: number;

  @ApiPropertyOptional({ description: 'Filter by reader ID' })
  @IsOptional()
  @IsInt()
  readerId?: number;

  @ApiPropertyOptional({ description: 'Filter active only (not returned)' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Filter rejected' })
  @IsOptional()
  @IsBoolean()
  rejected?: boolean;
}
