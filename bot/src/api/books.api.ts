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

/** Book as returned by the API search endpoint */
export interface BookSearchResult {
  id: number;
  name: string;
  images: string[];
  searchableName: string;
  authors: Array<{ author: { id: number; name: string } }>;
  collection: { id: number; name: string } | null;
  _count: { stocks: number };
}

/** Book detail from /app/books/:id */
export interface BookDetail {
  id: number;
  name: string;
  images: string[];
  description: string | null;
  authors: Array<{ author: { id: number; name: string } }>;
  collection: { id: number; name: string } | null;
  editions: Array<{
    id: number;
    pages: number | null;
    publisher: { id: number; name: string } | null;
  }>;
  rules: Array<{
    libraryId: number;
    library: { name: string };
    price: number;
    rentDuration: number;
    rarity: string;
  }>;
  _count: { stocks: number };
}

/** Stock status for a book at a specific library */
export interface BookStatus {
  libraryId: number;
  libraryName: string;
  busy: boolean;
  dueDate: string | null;
}

/**
 * Search books by name with pagination.
 * Calls GET /app/books?q=...&page=...&size=...
 */
export async function searchBooks(
  query: string,
  page: number = 1,
  size: number = 15,
): Promise<PaginatedResponse<BookSearchResult> | null> {
  const encodedQuery = encodeURIComponent(query);
  return apiClient.get<PaginatedResponse<BookSearchResult>>(
    `/app/books?q=${encodedQuery}&page=${page}&size=${size}&sort=name&order=asc`,
  );
}

/**
 * Get full book detail by ID.
 * Calls GET /app/books/:id
 */
export async function getBook(id: number): Promise<BookDetail | null> {
  return apiClient.get<BookDetail>(`/app/books/${id}`);
}

/**
 * Get rental statuses for a book across libraries.
 * Calls GET /app/books/:id/statuses
 */
export async function getBookStatuses(id: number): Promise<BookStatus[] | null> {
  return apiClient.get<BookStatus[]>(`/app/books/${id}/statuses`);
}
