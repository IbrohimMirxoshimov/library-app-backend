import { getBotConfig } from '../config';

/** Timeout for all API requests (10 seconds) */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Lightweight HTTP client for calling the NestJS API.
 * Uses native fetch with JWT authorization and 10-second timeout.
 * All errors are caught and returned as null — callers must handle missing data.
 */
class ApiClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    const config = getBotConfig();
    this.baseUrl = config.apiUrl;
    this.token = config.botServiceToken;
  }

  /**
   * Perform a GET request to the API.
   * Returns parsed JSON on success, null on any error.
   */
  async get<T>(path: string): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`API GET ${path} failed: ${response.status} ${response.statusText}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API GET ${path} error:`, error instanceof Error ? error.message : error);
      return null;
    }
  }

  /**
   * Perform a POST request to the API.
   * Returns parsed JSON on success, null on any error.
   */
  async post<T>(path: string, data?: unknown): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        console.error(`API POST ${path} failed: ${response.status} ${response.statusText}`);
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      console.error(`API POST ${path} error:`, error instanceof Error ? error.message : error);
      return null;
    }
  }
}

/** Singleton API client instance */
export const apiClient = new ApiClient();
