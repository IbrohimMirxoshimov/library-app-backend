import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateAuthorDto {
  @ApiProperty({ description: 'Author name', example: 'Alisher Navoiy' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Author images' })
  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[];
}
