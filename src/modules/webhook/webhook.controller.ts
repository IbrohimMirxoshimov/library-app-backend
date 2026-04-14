import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SmsStatus } from '@prisma/client';

/**
 * Eskiz webhook callback payload.
 * Eskiz sends POST with SMS delivery status updates.
 */
interface EskizWebhookPayload {
  /** Eskiz message ID — stored as providerMessageId on Sms record */
  message_id?: string;
  /** Delivery status string from Eskiz */
  status?: string;
}

/**
 * Maps Eskiz status strings to our SmsStatus enum.
 * Only updates for known statuses — unknown statuses are logged and ignored.
 */
function mapEskizStatus(eskizStatus: string): SmsStatus | null {
  const statusMap: Record<string, SmsStatus> = {
    DELIVERED: SmsStatus.DELIVERED,
    TRANSMIT: SmsStatus.SENT,
    SENT: SmsStatus.SENT,
    REJECTED: SmsStatus.ERROR,
    FAILED: SmsStatus.ERROR,
    UNDELIVERABLE: SmsStatus.ERROR,
  };

  return statusMap[eskizStatus.toUpperCase()] ?? null;
}

@ApiTags('webhook')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private prisma: PrismaService) {}

  @Post('eskiz')
  @Public()
  @ApiOperation({ summary: 'Eskiz SMS status callback' })
  @ApiResponse({ status: 201, description: 'Status processed' })
  async eskizCallback(@Body() payload: EskizWebhookPayload) {
    this.logger.log(`Eskiz webhook received: ${JSON.stringify(payload)}`);

    if (!payload.message_id || !payload.status) {
      this.logger.warn('Eskiz webhook missing message_id or status');
      return { received: true };
    }

    const mappedStatus = mapEskizStatus(payload.status);

    if (!mappedStatus) {
      this.logger.warn(`Unknown Eskiz status: ${payload.status}`);
      return { received: true };
    }

    // Find SMS by Eskiz provider message ID
    const sms = await this.prisma.sms.findFirst({
      where: { providerMessageId: payload.message_id },
    });

    if (!sms) {
      this.logger.warn(`SMS not found for Eskiz message_id: ${payload.message_id}`);
      return { received: true };
    }

    // Update SMS status — webhook only updates status, does NOT block users
    await this.prisma.sms.update({
      where: { id: sms.id },
      data: {
        status: mappedStatus,
        errorReason: mappedStatus === SmsStatus.ERROR ? `Eskiz: ${payload.status}` : undefined,
      },
    });

    this.logger.log(`SMS ${sms.id} status updated to ${mappedStatus} (Eskiz: ${payload.status})`);

    return { received: true };
  }
}
