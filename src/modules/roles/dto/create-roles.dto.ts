import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'librarian' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission IDs array', example: [1, 2, 3] })
  @IsOptional() @IsArray() @IsInt({ each: true })
  permissions?: number[];
}
