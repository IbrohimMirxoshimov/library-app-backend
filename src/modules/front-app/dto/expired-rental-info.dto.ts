import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ExpiredRentalInfoDto {
  @ApiProperty({ description: 'Phone number to check', example: '901234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
