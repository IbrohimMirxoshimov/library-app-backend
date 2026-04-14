import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyCodeDto {
  @ApiProperty({
    description: 'Phone number (9 digits without +998 prefix)',
    example: '901234567',
  })
  @IsString()
  @IsNotEmpty()
  @Length(9, 9, { message: 'Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak' })
  phone: string;

  @ApiProperty({
    description: 'Verification code sent via SMS',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Tasdiqlash kodi 6 ta raqamdan iborat bo\'lishi kerak' })
  code: string;
}
