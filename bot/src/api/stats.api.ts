import { apiClient } from './client';

/** Public statistics response shape */
export interface PublicStats {
  totalBooks: number;
  totalUsers: number;
  totalRentals: number;
  activeRentals: number;
}

/** Admin stats response (richer, used via service token) */
export interface AdminStats {
  totalBooks: number;
  totalUsers: number;
  totalStocks: number;
  activeRentals: number;
  completedRentals: number;
  topReaders: Array<{
    id: number;
    firstName: string;
    lastName: string;
    completedCount: number;
  }>;
  topBooks: Array<{
    id: number;
    name: string;
    rentalCount: number;
  }>;
  genderBreakdown: {
    male: number;
    female: number;
    unknown: number;
  };
  fewBooks: Array<{
    bookId: number;
    bookName: string;
    libraryId: number;
    totalCopies: number;
    availableCopies: number;
    sqrtThreshold: number;
  }>;
  rentalCounts: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

/**
 * Get public statistics (cached on API side).
 * Calls GET /app/stats
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  return apiClient.get<PublicStats>('/app/stats');
}

/**
 * Get admin-level statistics (includes fewBooks, topReaders, etc.).
 * Calls GET /stats — requires admin/internal auth.
 */
export async function getAdminStats(): Promise<AdminStats | null> {
  return apiClient.get<AdminStats>('/stats');
}
