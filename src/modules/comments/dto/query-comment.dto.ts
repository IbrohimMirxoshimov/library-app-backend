import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryCommentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by stock ID' })
  @IsOptional()
  @IsInt()
  stockId?: number;

  @ApiPropertyOptional({ description: 'Filter by rental ID' })
  @IsOptional()
  @IsInt()
  rentalId?: number;
}
