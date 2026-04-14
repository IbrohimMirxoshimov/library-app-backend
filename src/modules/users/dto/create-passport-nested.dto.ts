import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePassportNestedDto {
  @ApiProperty({ description: 'Passport series and number', example: 'AA1234567' })
  @IsString()
  @IsNotEmpty()
  passportId: string;

  @ApiPropertyOptional({ description: 'PINFL' })
  @IsOptional()
  @IsString()
  pinfl?: string;

  @ApiPropertyOptional({ description: 'Passport image path' })
  @IsOptional()
  @IsString()
  image?: string;
}
