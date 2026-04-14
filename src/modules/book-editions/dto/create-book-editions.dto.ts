import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, IsDateString } from 'class-validator';

export class CreateBookEditionDto {
  @ApiProperty({ description: 'Book ID' })
  @IsInt()
  bookId: number;

  @ApiPropertyOptional({ description: 'Number of pages' })
  @IsOptional() @IsInt()
  pages?: number;

  @ApiPropertyOptional({ description: 'Print date' })
  @IsOptional() @IsDateString()
  printedAt?: string;

  @ApiPropertyOptional({ description: 'ISBN' })
  @IsOptional() @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Edition number', example: '2-nashr' })
  @IsOptional() @IsString()
  editionNumber?: string;

  @ApiPropertyOptional({ description: 'Images' })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Publisher ID' })
  @IsOptional() @IsInt()
  publisherId?: number;
}
