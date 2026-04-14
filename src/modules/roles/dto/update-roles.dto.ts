import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Permission IDs array' })
  @IsOptional() @IsArray() @IsInt({ each: true })
  permissions?: number[];
}
