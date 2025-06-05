// Simple in-memory cache for API responses
// Helps reduce database load and improve response times

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Remove expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.keys()),
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Singleton instance
const cache = new MemoryCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

// Cache helper functions
export function getCached<T>(key: string): T | null {
  return cache.get<T>(key);
}

export function setCached<T>(key: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
  cache.set(key, data, ttl);
}

export function deleteCached(key: string): boolean {
  return cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return cache.getStats();
}

// Cache key generators
export const cacheKeys = {
  events: {
    list: (filters?: Record<string, any>) => 
      `events:list:${JSON.stringify(filters || {})}`,
    detail: (id: string) => `events:detail:${id}`,
    userRsvps: (userId: string) => `events:user_rsvps:${userId}`,
    ticketTypes: (eventId: string) => `events:ticket_types:${eventId}`,
  },
  users: {
    profile: (id: string) => `users:profile:${id}`,
    googleConnection: (id: string) => `users:google:${id}`,
  },
  stats: {
    eventAttendees: (eventId: string) => `stats:attendees:${eventId}`,
    userEventHistory: (userId: string) => `stats:user_history:${userId}`,
  },
} as const;

// Cache invalidation helpers
export function invalidateEventCache(eventId?: string): void {
  if (eventId) {
    // Invalidate specific event caches
    deleteCached(cacheKeys.events.detail(eventId));
    deleteCached(cacheKeys.events.ticketTypes(eventId));
    deleteCached(cacheKeys.stats.eventAttendees(eventId));
  }
  
  // Invalidate list caches (they might include the updated event)
  const stats = getCacheStats();
  stats.entries
    .filter(key => key.startsWith('events:list:'))
    .forEach(key => deleteCached(key));
}

export function invalidateUserCache(userId: string): void {
  deleteCached(cacheKeys.users.profile(userId));
  deleteCached(cacheKeys.users.googleConnection(userId));
  deleteCached(cacheKeys.events.userRsvps(userId));
  deleteCached(cacheKeys.stats.userEventHistory(userId));
}

// Wrapper function for cached API calls
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  setCached(key, data, ttl);
  
  return data;
}

export default cache; 