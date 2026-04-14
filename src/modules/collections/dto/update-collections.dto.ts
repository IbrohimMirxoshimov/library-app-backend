import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';

export class UpdateCollectionDto {
  @ApiPropertyOptional({ description: 'Collection name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional() @IsInt()
  sort?: number;
}
