import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SendCodeDto {
  @ApiProperty({
    description: 'Phone number (9 digits without +998 prefix)',
    example: '901234567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak' })
  phone: string;
}
