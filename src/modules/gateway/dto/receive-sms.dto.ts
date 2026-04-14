import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ReceiveSmsDto {
  @ApiProperty({
    description: 'Sender phone number (9 digits)',
    example: '901234567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak' })
  phone: string;

  @ApiProperty({ description: 'SMS text content', example: 'Ha, kitobni qaytaraman.' })
  @IsString()
  @IsNotEmpty()
  text: string;
}
