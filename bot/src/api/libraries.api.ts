import { apiClient } from './client';

/** Library as returned by the public libraries endpoint */
export interface Library {
  id: number;
  name: string;
  active: boolean;
  link: string | null;
  address: {
    region: {
      id: number;
      name: string;
    };
  } | null;
}

/**
 * Get all active libraries.
 * Calls GET /app/libraries
 */
export async function getLibraries(): Promise<Library[] | null> {
  return apiClient.get<Library[]>('/app/libraries');
}
