import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateAuthorDto {
  @ApiPropertyOptional({ description: 'Author name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Author images' })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}
