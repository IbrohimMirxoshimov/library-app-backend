import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FrontSigninDto {
  @ApiProperty({ description: 'Phone number (9 digits)', example: '901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: 'Password or passport series', example: 'AA1234567' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
