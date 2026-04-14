import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateRegionDto {
  @ApiProperty({ description: 'Region name', example: 'Toshkent shahri' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Parent region ID (null = top level)' })
  @IsOptional() @IsInt()
  parentId?: number;
}
