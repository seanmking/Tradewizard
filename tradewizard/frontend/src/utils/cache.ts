/**
 * Frontend caching system for API responses
 * Provides a simple in-memory cache with TTL support
 */

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class FrontendCache {
  private cache: Map<string, CacheItem<any>>;
  private stats: CacheStats;
  private options: CacheOptions;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      maxSize: 100, // Default max size
      ...options
    };
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Optional TTL override in milliseconds
   */
  set(key: string, value: any, ttl?: number): void {
    // Check if we need to evict items due to size constraints
    if (this.options.maxSize && this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      // Simple eviction strategy: remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl || this.options.ttl || 0);
    this.cache.set(key, { value, expiry });
    this.stats.size = this.cache.size;
  }

  /**
   * Get a value from the cache
   * @param key The cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // If item doesn't exist or has expired
    if (!item || (item.expiry && Date.now() > item.expiry)) {
      if (item) {
        // Clean up expired item
        this.cache.delete(key);
        this.stats.size = this.cache.size;
      }
      this.stats.misses++;
      return undefined;
    }
    
    this.stats.hits++;
    return item.value as T;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key The cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && (item.expiry === 0 || Date.now() <= item.expiry);
  }

  /**
   * Delete a key from the cache
   * @param key The cache key
   * @returns True if the key was deleted
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
}

/**
 * Create a function that wraps an API call with caching
 * @param fn The API call function to wrap
 * @param keyFn Function to generate a cache key from the parameters
 * @param options Cache options
 * @returns A function that will use the cache when possible
 */
export function withCache<T, P extends any[]>(
  fn: (...args: P) => Promise<T>,
  keyFn: (...args: P) => string,
  options?: CacheOptions
): (...args: P) => Promise<T> {
  const cache = frontendCache;
  
  return async (...args: P): Promise<T> => {
    const key = keyFn(...args);
    
    // Check if we have a cached value
    const cachedValue = cache.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // If not cached, call the original function
    const result = await fn(...args);
    
    // Cache the result
    cache.set(key, result, options?.ttl);
    
    return result;
  };
}

// Create a singleton instance of the cache
export const frontendCache = new FrontendCache();

// Default export for convenience
export default frontendCache; 