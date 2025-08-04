import { describe, it, expect, beforeEach } from 'vitest';
import { EntityPool } from '@/ecs/core/Entity';

describe('EntityPool', () => {
  let pool: EntityPool;

  beforeEach(() => {
    pool = new EntityPool();
  });

  describe('acquire', () => {
    it('should generate unique entity IDs', () => {
      const id1 = pool.acquire();
      const id2 = pool.acquire();

      expect(id1).not.toBe(id2);
      expect(pool.isActive(id1)).toBe(true);
      expect(pool.isActive(id2)).toBe(true);
    });

    it('should generate sequential IDs', () => {
      const id1 = pool.acquire();
      const id2 = pool.acquire();

      expect(id1).toBe('entity_1');
      expect(id2).toBe('entity_2');
    });
  });

  describe('release', () => {
    it('should release entity ID and make it available for reuse', () => {
      const id1 = pool.acquire();
      pool.release(id1);

      expect(pool.isActive(id1)).toBe(false);

      const id2 = pool.acquire();
      expect(id2).toBe(id1); // 再利用される
    });

    it('should not release non-active entity ID', () => {
      const id1 = pool.acquire();
      pool.release('non_existent_id');

      expect(pool.isActive(id1)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const id1 = pool.acquire();
      pool.acquire();

      let stats = pool.getStats();
      expect(stats.active).toBe(2);
      expect(stats.available).toBe(0);
      expect(stats.total).toBe(2);

      pool.release(id1);
      stats = pool.getStats();
      expect(stats.active).toBe(1);
      expect(stats.available).toBe(1);
      expect(stats.total).toBe(2);
    });
  });

  describe('getActiveEntities', () => {
    it('should return array of active entity IDs', () => {
      const id1 = pool.acquire();
      const id2 = pool.acquire();

      const activeEntities = pool.getActiveEntities();
      expect(activeEntities).toHaveLength(2);
      expect(activeEntities).toContain(id1);
      expect(activeEntities).toContain(id2);
    });
  });

  describe('clear', () => {
    it('should clear all entities and reset counter', () => {
      pool.acquire();
      pool.acquire();
      
      pool.clear();

      const stats = pool.getStats();
      expect(stats.active).toBe(0);
      expect(stats.available).toBe(0);
      expect(stats.total).toBe(0);

      const newId = pool.acquire();
      expect(newId).toBe('entity_1'); // カウンターがリセットされる
    });
  });
});