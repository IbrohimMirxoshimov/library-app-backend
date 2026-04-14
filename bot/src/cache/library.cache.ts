import { getLibraries, Library } from '../api/libraries.api';

/** Cache TTL — 5 minutes in milliseconds */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** In-memory library list cache with 5 minute TTL */
class LibraryCache {
  private libraries: Library[] = [];
  private lastFetchedAt: number = 0;

  /**
   * Get the cached library list.
   * Refreshes from the API if the cache is stale (> 5 min old) or empty.
   */
  async getLibraries(): Promise<Library[]> {
    const now = Date.now();

    if (this.libraries.length === 0 || now - this.lastFetchedAt > CACHE_TTL_MS) {
      await this.refresh();
    }

    return this.libraries;
  }

  /**
   * Find a library by ID from the cache.
   */
  async getById(id: number): Promise<Library | undefined> {
    const libs = await this.getLibraries();
    return libs.find((lib) => lib.id === id);
  }

  /**
   * Force refresh the cache from the API.
   */
  async refresh(): Promise<void> {
    const result = await getLibraries();
    if (result) {
      this.libraries = result;
      this.lastFetchedAt = Date.now();
    }
  }
}

/** Singleton library cache instance */
export const libraryCache = new LibraryCache();
