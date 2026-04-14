import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class UpdateLibraryDto {
  @ApiPropertyOptional({ description: 'Library name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'External link' })
  @IsOptional() @IsString()
  link?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional() @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Schedule JSON' })
  @IsOptional()
  schedule?: LibrarySchedule;

  @ApiPropertyOptional({ description: 'Address ID' })
  @IsOptional() @IsInt()
  addressId?: number;
}
