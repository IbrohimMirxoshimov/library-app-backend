import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Admin signin — username or phone + password.
   * Returns JWT token on success.
   */
  async signin(dto: SigninDto) {
    // Find user by username or phone
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username: dto.login }, { phone: dto.login }],
      },
      include: {
        role: true,
        adminLibrary: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    // Admin users must have a role
    if (!user.role) {
      throw new UnauthorizedException('Sizda admin huquqi yo\'q');
    }

    // Check password
    if (!user.password) {
      throw new UnauthorizedException('Parol o\'rnatilmagan');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Login yoki parol noto\'g\'ri');
    }

    // Generate JWT
    const token = this.jwtService.sign({
      sub: user.id,
      type: 'user',
    });

    this.logger.log(`Admin signin: ${user.username || user.phone} (ID: ${user.id})`);

    const { password: _, ...profile } = user;
    return { token, user: profile };
  }

  /**
   * Get current admin profile from JWT token.
   */
  async me(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        role: true,
        adminLibrary: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    const { password: _, ...profile } = user;
    return profile;
  }
}
