import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateRentalDto {
  @ApiProperty({ description: 'Reader (user) ID' })
  @IsInt()
  readerId: number;

  @ApiProperty({ description: 'Stock ID' })
  @IsInt()
  stockId: number;

  @ApiPropertyOptional({ description: 'Manual reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Issue date (default: now, max 1 year ago)' })
  @IsOptional()
  @IsDateString()
  issuedAt?: string;
}
