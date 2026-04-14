import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class LinkLibraryDto {
  @ApiProperty({ description: 'Hash from check-passport response' })
  @IsString()
  @IsNotEmpty()
  hash: string;

  @ApiPropertyOptional({ description: 'Library ID (only for owner)' })
  @IsOptional()
  @IsInt()
  libraryId?: number;
}
