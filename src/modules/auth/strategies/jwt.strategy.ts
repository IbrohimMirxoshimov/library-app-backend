import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getConfig } from '../../../config';
import { PrismaService } from '../../prisma/prisma.service';
import { RequestUser } from '../../../common/interfaces/request-user.interface';

interface JwtPayload {
  sub: number;
  type: 'user' | 'internal';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const config = getConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    // Internal (bot service) token — no DB lookup needed
    if (payload.type === 'internal') {
      return {
        id: 0,
        type: 'internal',
        roleName: 'owner',
        permissions: [],
        adminLibraryId: null,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return {
      id: user.id,
      type: 'user',
      roleName: user.role?.name ?? null,
      permissions: user.role?.permissions ?? [],
      adminLibraryId: user.adminLibraryId,
    };
  }
}
