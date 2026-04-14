import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  size: number;

  @ApiProperty({ description: 'Total number of items' })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  constructor(page: number, size: number, totalItems: number) {
    this.page = page;
    this.size = size;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / size);
  }
}

/**
 * Generic paginated response wrapper.
 * Used by all list endpoints.
 */
export class PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;

  constructor(items: T[], page: number, size: number, totalItems: number) {
    this.items = items;
    this.meta = new PaginationMeta(page, size, totalItems);
  }
}
