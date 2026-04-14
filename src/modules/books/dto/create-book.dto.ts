import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookLanguage } from '@prisma/client';
import { CreateBookRuleDto } from './book-rule.dto';

export class CreateBookDto {
  @ApiProperty({ description: 'Book title', example: 'Mehrobdan chayon' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Book description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Cover images (file paths)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'ISBN' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Book language', enum: BookLanguage, default: 'UZ' })
  @IsOptional()
  @IsEnum(BookLanguage)
  language?: BookLanguage;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: 'Tags', example: ['roman', 'tarix'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Collection ID' })
  @IsOptional()
  @IsInt()
  collectionId?: number;

  @ApiPropertyOptional({ description: 'Author IDs', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  authorIds?: number[];

  @ApiProperty({ description: 'Book rule (price, duration, rarity)', type: CreateBookRuleDto })
  @ValidateNested()
  @Type(() => CreateBookRuleDto)
  bookRule: CreateBookRuleDto;
}
