import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePublisherDto {
  @ApiProperty({ description: 'Publisher name', example: 'Sharq nashriyoti' })
  @IsString() @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Publisher logo path' })
  @IsOptional() @IsString()
  image?: string;
}
