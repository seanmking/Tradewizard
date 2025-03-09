declare module 'node-cache' {
  class NodeCache {
    constructor(options?: any);
    set(key: string, value: any, ttl?: number): boolean;
    get<T>(key: string): T | undefined;
    has(key: string): boolean;
    del(key: string | string[]): number;
    flushAll(): void;
    getStats(): {
      keys: number;
      hits: number;
      misses: number;
      ksize: number;
      vsize: number;
    };
    // Add other methods as needed
  }
  export = NodeCache;
} 