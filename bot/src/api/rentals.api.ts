import { apiClient } from './client';

/** Paginated response shape from the API */
interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    size: number;
    totalItems: number;
    totalPages: number;
  };
}

/** A rental record as returned by the account books endpoint */
export interface UserRental {
  id: number;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  stock: {
    id: number;
    book: {
      id: number;
      name: string;
      images: string[];
    };
  };
  library: {
    id: number;
    name: string;
  };
}

/**
 * Get a user's rented books (active or returned).
 * Calls GET /app/account/books?page=...&size=...
 *
 * Note: This endpoint requires user authentication. The bot uses its service token,
 * so the API must handle internal token access to user-specific data.
 * The returned=0 means currently reading, returned=1 means already returned.
 */
export async function getMyBooks(
  page: number = 1,
  size: number = 15,
  returned: boolean = false,
): Promise<PaginatedResponse<UserRental> | null> {
  const returnedParam = returned ? '1' : '0';
  return apiClient.get<PaginatedResponse<UserRental>>(
    `/app/account/books?page=${page}&size=${size}&returned=${returnedParam}`,
  );
}
