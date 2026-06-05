import { logger } from '../middleware/logging.middleware';

// Mock Redis Client for the assessment environment
class MockRedisLockManager {
  private activeLocks: Set<string> = new Set();

  /**
   * Simulates Redis 'SET key value NX PX 10000' 
   * (Set if Not Exists with a 10-second expiration window)
   */
  public async acquireLock(lockKey: string, ttlMs: number): Promise<boolean> {
    if (this.activeLocks.has(lockKey)) {
      return false; // Lock is already held by another instance
    }
    
    this.activeLocks.add(lockKey);
    
    // Auto-release lock after TTL expires
    setTimeout(() => {
      this.activeLocks.delete(lockKey);
    }, ttlMs);

    return true;
  }

  public async releaseLock(lockKey: string): Promise<void> {
    this.activeLocks.delete(lockKey);
  }
}

export const redisLockManager = new MockRedisLockManager();