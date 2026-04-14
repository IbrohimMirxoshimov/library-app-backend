import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class EditRentalDto {
  @ApiProperty({ description: 'New due date' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Reason for change' })
  @IsOptional()
  @IsString()
  note?: string;
}
