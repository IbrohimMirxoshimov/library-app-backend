import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsEnum } from 'class-validator';
import { BookRarity } from '@prisma/client';

/** BookRule fields for create — price and rentDuration required */
export class CreateBookRuleDto {
  @ApiProperty({ description: 'Rental price in som', example: 50000 })
  @IsInt()
  price: number;

  @ApiProperty({ description: 'Max rental duration in days', example: 15 })
  @IsInt()
  rentDuration: number;

  @ApiPropertyOptional({ description: 'Rarity level', enum: BookRarity, default: 'COMMON' })
  @IsOptional()
  @IsEnum(BookRarity)
  rarity?: BookRarity;
}

/** BookRule fields for update — all optional */
export class UpdateBookRuleDto {
  @ApiPropertyOptional({ description: 'Rental price in som' })
  @IsOptional()
  @IsInt()
  price?: number;

  @ApiPropertyOptional({ description: 'Max rental duration in days' })
  @IsOptional()
  @IsInt()
  rentDuration?: number;

  @ApiPropertyOptional({ description: 'Rarity level', enum: BookRarity })
  @IsOptional()
  @IsEnum(BookRarity)
  rarity?: BookRarity;
}
