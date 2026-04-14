import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({ description: 'Collection name', example: 'Badiiy adabiyot' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 0 })
  @IsOptional() @IsInt()
  sort?: number;
}
