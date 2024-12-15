import { UserDataStreamState, MemoryCache } from "./model";

type RequestKey = string;
type CacheState = UserDataStreamState;

class RequestCacheManager {
  private cacheMap: Map<RequestKey, MemoryCache<CacheState>>;

  constructor() {
    this.cacheMap = new Map();
  }

  getOrCreateCache(
    key: RequestKey,
    ttl: number,
    updateFn: () => Promise<CacheState>
  ): MemoryCache<CacheState> {
    if (!this.cacheMap.has(key)) {
      const cache = new MemoryCache<CacheState>({ update: updateFn, ttl });
      this.cacheMap.set(key, cache);
    }

    return this.cacheMap.get(key)!;
  }

  async read(key: RequestKey): Promise<CacheState | undefined> {
    const cache = this.cacheMap.get(key);

    if (cache) {
      return await cache.read();
    }

    return undefined;
  }

  clear(key: RequestKey): void {
    this.cacheMap.delete(key);
  }

  clearAll(): void {
    this.cacheMap.clear();
  }
}

export const dataStreamRequestCache = new RequestCacheManager();
