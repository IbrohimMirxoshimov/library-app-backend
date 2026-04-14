import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateRegionDto {
  @ApiPropertyOptional({ description: 'Region name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Parent region ID' })
  @IsOptional() @IsInt()
  parentId?: number;
}
