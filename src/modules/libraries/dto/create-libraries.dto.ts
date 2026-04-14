import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class CreateLibraryDto {
  @ApiProperty({ description: 'Library name', example: 'Mehr kutubxonasi' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'External link' })
  @IsOptional() @IsString()
  link?: string;

  @ApiPropertyOptional({ description: 'Active status', default: true })
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
