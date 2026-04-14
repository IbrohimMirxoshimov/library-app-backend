import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/** TTL for verification codes in seconds (5 minutes) */
const CODE_TTL_SECONDS = 300;

/** Length of generated verification code */
const CODE_LENGTH = 6;

/** Redis key prefix for verification codes */
const VERIFY_KEY_PREFIX = 'verify:';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private redis: RedisService) {}

  /**
   * Generates a random numeric code and stores it in Redis with a 5-minute TTL.
   * Returns the generated code (caller decides how to send it — Eskiz, gateway, etc.).
   */
  async sendCode(phone: string): Promise<{ message: string }> {
    const code = this.generateCode();
    const key = `${VERIFY_KEY_PREFIX}${phone}`;

    await this.redis.set(key, code, 'EX', CODE_TTL_SECONDS);

    // TODO: Send SMS via Eskiz provider (external integration is separate)
    this.logger.log(`Verification code for ${phone}: ${code}`);

    return { message: 'Tasdiqlash kodi yuborildi' };
  }

  /**
   * Verifies the code from Redis. Deletes the key on success to prevent reuse.
   * Throws BadRequestException if code is invalid or expired.
   */
  async verifyCode(phone: string, code: string): Promise<{ verified: boolean }> {
    const key = `${VERIFY_KEY_PREFIX}${phone}`;
    const storedCode = await this.redis.get(key);

    if (!storedCode) {
      throw new BadRequestException('Tasdiqlash kodi topilmadi yoki muddati tugagan');
    }

    if (storedCode !== code) {
      throw new BadRequestException('Tasdiqlash kodi noto\'g\'ri');
    }

    // Delete key after successful verification to prevent reuse
    await this.redis.del(key);

    return { verified: true };
  }

  /**
   * Generates a random numeric code of CODE_LENGTH digits.
   * Uses Math.random — sufficient for SMS verification codes.
   */
  private generateCode(): string {
    const min = Math.pow(10, CODE_LENGTH - 1);
    const max = Math.pow(10, CODE_LENGTH) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }
}
