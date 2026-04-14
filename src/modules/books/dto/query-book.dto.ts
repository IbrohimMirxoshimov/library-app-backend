import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { BookLanguage } from '@prisma/client';

export class QueryBookDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by collection ID' })
  @IsOptional()
  @IsInt()
  collectionId?: number;

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsInt()
  authorId?: number;

  @ApiPropertyOptional({ description: 'Filter by language', enum: BookLanguage })
  @IsOptional()
  @IsEnum(BookLanguage)
  language?: BookLanguage;
}
