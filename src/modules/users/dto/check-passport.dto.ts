import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CheckPassportDto {
  @ApiProperty({ description: 'Passport series and number', example: 'AA1234567' })
  @IsString()
  @IsNotEmpty()
  passportId: string;
}
