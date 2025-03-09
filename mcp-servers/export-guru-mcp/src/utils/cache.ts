import NodeCache from 'node-cache';

// Create a cache instance
const nodeCache = new NodeCache({
  stdTTL: 3600, // Default TTL: 1 hour
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false // Don't clone objects (for performance)
});

// Cache interface
export const cache = {
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found
   */
  get: async <T>(key: string): Promise<T | undefined> => {
    return nodeCache.get<T>(key);
  },
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, uses default if not specified)
   * @returns true if successful, false otherwise
   */
  set: async <T>(key: string, value: T, ttl?: number): Promise<boolean> => {
    if (ttl === undefined) {
      return nodeCache.set(key, value);
    }
    return nodeCache.set(key, value, ttl);
  },
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   * @returns true if successful, false if key doesn't exist
   */
  delete: async (key: string): Promise<boolean> => {
    return nodeCache.del(key) > 0;
  },
  
  /**
   * Clear the entire cache
   */
  clear: async (): Promise<void> => {
    nodeCache.flushAll();
  },
  
  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  stats: async (): Promise<{ keys: number; hits: number; misses: number; ksize: number; vsize: number }> => {
    return nodeCache.getStats();
  }
};

/**
 * Decorator for caching function results
 * @param ttl Time to live in seconds
 * @returns Decorated function
 */
export function cacheable(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Create a cache key from the function name and arguments
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== undefined) {
        return cachedResult;
      }
      
      // Call the original method
      const result = await originalMethod.apply(this, args);
      
      // Cache the result
      await cache.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}