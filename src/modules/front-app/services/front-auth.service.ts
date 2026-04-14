import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { FrontSigninDto } from '../dto/front-signin.dto';
import { normalizePhone } from '../../../common/utils/phone.utils';

@Injectable()
export class FrontAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signin(dto: FrontSigninDto): Promise<{ token: string }> {
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new UnauthorizedException('Noto\'g\'ri telefon raqami');
    }

    const user = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
      include: { passports: { where: { isActive: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Telefon raqami yoki parol noto\'g\'ri');
    }

    // If user has a password, validate it
    if (user.password) {
      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) {
        throw new UnauthorizedException('Telefon raqami yoki parol noto\'g\'ri');
      }
    } else {
      // No password — compare with passport series
      const passport = user.passports[0];
      if (!passport || passport.passportId.toUpperCase() !== dto.password.toUpperCase()) {
        throw new UnauthorizedException('Telefon raqami yoki parol noto\'g\'ri');
      }
    }

    const token = this.jwtService.sign({ sub: user.id, type: 'user' });
    return { token };
  }
}
