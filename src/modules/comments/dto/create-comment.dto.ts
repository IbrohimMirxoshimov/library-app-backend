import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Stock ID (for stock comments)' })
  @IsOptional()
  @IsInt()
  stockId?: number;

  @ApiPropertyOptional({ description: 'Rental ID (for rental comments)' })
  @IsOptional()
  @IsInt()
  rentalId?: number;
}
