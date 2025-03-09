/**
 * Frontend caching system for API responses
 * Provides a simple in-memory cache with TTL support
 */

class FrontendCache {
  constructor(options = {}) {
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
   * @param {string} key The cache key
   * @param {any} value The value to cache
   * @param {number} ttl Optional TTL override in milliseconds
   */
  set(key, value, ttl) {
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
   * @param {string} key The cache key
   * @returns {any} The cached value or undefined if not found or expired
   */
  get(key) {
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
    return item.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key The cache key
   * @returns {boolean} True if the key exists and is not expired
   */
  has(key) {
    const item = this.cache.get(key);
    return !!item && (item.expiry === 0 || Date.now() <= item.expiry);
  }

  /**
   * Delete a key from the cache
   * @param {string} key The cache key
   * @returns {boolean} True if the key was deleted
   */
  delete(key) {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

/**
 * Create a function that wraps an API call with caching
 * @param {Function} fn The API call function to wrap
 * @param {Function} keyFn Function to generate a cache key from the parameters
 * @param {Object} options Cache options
 * @returns {Function} A function that will use the cache when possible
 */
function withCache(fn, keyFn, options) {
  const cache = frontendCache;
  
  return async (...args) => {
    const key = keyFn(...args);
    
    // Check if we have a cached value
    const cachedValue = cache.get(key);
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
const frontendCache = new FrontendCache();

// Export the cache and helper functions
module.exports = {
  FrontendCache,
  frontendCache,
  withCache
}; 