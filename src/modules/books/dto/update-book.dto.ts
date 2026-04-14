import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BookLanguage } from '@prisma/client';
import { UpdateBookRuleDto } from './book-rule.dto';

export class UpdateBookDto {
  @ApiPropertyOptional({ description: 'Book title' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Book description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cover images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'ISBN' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Book language', enum: BookLanguage })
  @IsOptional()
  @IsEnum(BookLanguage)
  language?: BookLanguage;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection ID' })
  @IsOptional()
  @IsInt()
  collectionId?: number;

  @ApiPropertyOptional({ description: 'Author IDs (replaces existing)' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  authorIds?: number[];

  @ApiPropertyOptional({ description: 'Book rule (price, duration, rarity)', type: UpdateBookRuleDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateBookRuleDto)
  bookRule?: UpdateBookRuleDto;
}
