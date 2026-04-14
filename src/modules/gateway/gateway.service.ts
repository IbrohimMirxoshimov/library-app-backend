import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ReceiveSmsDto } from './dto/receive-sms.dto';
import { UpdateSmsStatusDto } from './dto/update-sms-status.dto';
import { SmsStatus, SmsProvider } from '@prisma/client';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RequestUser } from '../../common/interfaces/request-user.interface';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Register a new Android device for SMS gateway.
   * Links the device to the authenticated user and their library.
   */
  async registerDevice(dto: RegisterDeviceDto, user: RequestUser) {
    const device = await this.prisma.device.create({
      data: {
        brand: dto.brand,
        model: dto.model,
        buildId: dto.buildId,
        fcmToken: dto.fcmToken,
        userId: user.id,
        libraryId: user.adminLibraryId,
      },
    });

    this.logger.log(`Device registered: id=${device.id}, user=${user.id}`);

    return device;
  }

  /**
   * Update device info (FCM token, enabled status, etc.).
   */
  async updateDevice(id: number, dto: UpdateDeviceDto) {
    const device = await this.prisma.device.findFirst({
      where: { id, deletedAt: null },
    });

    if (!device) {
      throw new NotFoundException('Qurilma topilmadi');
    }

    return this.prisma.device.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Record an incoming SMS received by the gateway device.
   * Creates an SMS record with DELIVERED status and receivedAt timestamp.
   */
  async receiveSms(deviceId: number, dto: ReceiveSmsDto) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, deletedAt: null },
    });

    if (!device) {
      throw new NotFoundException('Qurilma topilmadi');
    }

    // Try to find a user by phone for linking
    const user = await this.prisma.user.findFirst({
      where: { phone: dto.phone, deletedAt: null },
      select: { id: true },
    });

    const sms = await this.prisma.sms.create({
      data: {
        phone: dto.phone,
        text: dto.text,
        status: SmsStatus.DELIVERED,
        provider: SmsProvider.GATEWAY,
        receivedAt: new Date(),
        deviceId,
        userId: user?.id,
      },
    });

    this.logger.log(`SMS received via gateway: id=${sms.id}, phone=${dto.phone}`);

    return sms;
  }

  /**
   * Get pending (DRAFT) SMS messages assigned to a device.
   * Called by the Android app after receiving FCM push notification.
   */
  async getPendingSms(deviceId: number, query: PaginationQueryDto) {
    const device = await this.prisma.device.findFirst({
      where: { id: deviceId, deletedAt: null },
    });

    if (!device) {
      throw new NotFoundException('Qurilma topilmadi');
    }

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const where = {
      deviceId,
      status: SmsStatus.DRAFT,
    };

    const [items, total] = await Promise.all([
      this.prisma.sms.findMany({
        where,
        skip: (page - 1) * size,
        take: size,
        orderBy: { updatedAt: 'asc' },
        select: {
          id: true,
          phone: true,
          text: true,
          updatedAt: true,
        },
      }),
      this.prisma.sms.count({ where }),
    ]);

    return new PaginatedResponse(items, page, size, total);
  }

  /**
   * Update SMS status after the device has attempted to send it.
   * Transitions: DRAFT → SENT → DELIVERED / ERROR
   */
  async updateSmsStatus(deviceId: number, dto: UpdateSmsStatusDto) {
    const sms = await this.prisma.sms.findFirst({
      where: { id: dto.smsId, deviceId },
    });

    if (!sms) {
      throw new BadRequestException('SMS topilmadi yoki bu qurilmaga tegishli emas');
    }

    const updated = await this.prisma.sms.update({
      where: { id: dto.smsId },
      data: { status: dto.status },
    });

    this.logger.log(`SMS status updated: id=${dto.smsId}, status=${dto.status}`);

    // TODO: Send FCM push notification to device when new SMS is available
    // Firebase/FCM sending is stubbed — will be implemented with firebase-admin integration

    return updated;
  }

  /**
   * Send FCM push notification to a device (stubbed).
   * Will be implemented when Firebase Admin SDK integration is added.
   */
  async sendFcmPush(deviceId: number, _data: Record<string, string>): Promise<void> {
    this.logger.log(`[STUB] FCM push to device ${deviceId}: PENDING_SMS_AVAILABLE`);
    // TODO: Implement with firebase-admin
    // const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    // await admin.messaging().send({ token: device.fcmToken, data });
  }
}
