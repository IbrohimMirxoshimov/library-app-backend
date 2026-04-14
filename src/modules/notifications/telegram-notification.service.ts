import { Injectable, Logger } from '@nestjs/common';
import { getConfig } from '../../config';

/** Telegram Bot API base URL */
const TELEGRAM_API_BASE = 'https://api.telegram.org';

/** Timeout for Telegram API requests in milliseconds */
const REQUEST_TIMEOUT_MS = 10000;

@Injectable()
export class TelegramNotificationService {
  private readonly logger = new Logger(TelegramNotificationService.name);
  private readonly baseUrl: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = `${TELEGRAM_API_BASE}/bot${config.telegram.botToken}`;
  }

  /**
   * Send a text message to a Telegram chat.
   * Uses native fetch (Node 24). Errors are logged but never thrown —
   * notifications must not break the app.
   */
  async sendMessage(
    chatId: string | number,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `Telegram sendMessage failed (${response.status}): ${body}`,
        );
        return false;
      }

      this.logger.log(`Message sent to chat ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Send a photo to a Telegram chat.
   * Uses native fetch (Node 24). Errors are logged but never thrown —
   * notifications must not break the app.
   */
  async sendPhoto(
    chatId: string | number,
    photo: string,
    caption?: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo,
          ...(caption && { caption, parse_mode: parseMode }),
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.error(
          `Telegram sendPhoto failed (${response.status}): ${body}`,
        );
        return false;
      }

      this.logger.log(`Photo sent to chat ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send photo to chat ${chatId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
}
