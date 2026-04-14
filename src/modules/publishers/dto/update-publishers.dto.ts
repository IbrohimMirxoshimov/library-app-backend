import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePublisherDto {
  @ApiPropertyOptional({ description: 'Publisher name' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Publisher logo path' })
  @IsOptional() @IsString()
  image?: string;
}
