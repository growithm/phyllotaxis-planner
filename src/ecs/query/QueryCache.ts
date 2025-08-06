/**
 * クエリ結果のキャッシュ管理
 */

import { EntityId } from '@/ecs/core/Entity';

/**
 * キャッシュエントリ
 */
interface CacheEntry {
  result: EntityId[];
  timestamp: number;
  accessCount: number;
}

/**
 * キャッシュ設定オプション
 */
export interface QueryCacheOptions {
  maxSize?: number;
  ttl?: number;
  enabled?: boolean;
}

/**
 * キャッシュ統計情報
 */
export interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  maxSize: number;
  hitRate: number;
}

/**
 * クエリ結果のキャッシュ管理クラス
 */
export class QueryCache {
  private cache: Map<string, CacheEntry>;
  private accessOrder: string[]; // LRU管理用
  private maxSize: number;
  private ttl: number; // Time To Live (ms)
  private enabled: boolean;
  
  // 統計情報
  private totalRequests: number = 0;
  private cacheHits: number = 0;

  constructor(options: QueryCacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 5000; // 5秒
    this.enabled = options.enabled !== false;
  }

  /**
   * キャッシュ取得
   */
  get(queryKey: string): EntityId[] | null {
    if (!this.enabled) {
      return null;
    }

    this.totalRequests++;
    const entry = this.cache.get(queryKey);
    
    if (!entry) {
      return null;
    }

    // TTL チェック
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(queryKey);
      return null;
    }

    // LRU更新
    this.updateAccessOrder(queryKey);
    entry.accessCount++;
    this.cacheHits++;
    
    return [...entry.result]; // コピーを返す
  }

  /**
   * キャッシュ設定
   */
  set(queryKey: string, result: EntityId[]): void {
    if (!this.enabled) {
      return;
    }

    // サイズ制限チェック
    if (this.cache.size >= this.maxSize && !this.cache.has(queryKey)) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      result: [...result], // コピーを保存
      timestamp: Date.now(),
      accessCount: 1
    };

    this.cache.set(queryKey, entry);
    this.updateAccessOrder(queryKey);
  }

  /**
   * キャッシュ削除
   */
  delete(queryKey: string): void {
    this.cache.delete(queryKey);
    const index = this.accessOrder.indexOf(queryKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * キャッシュクリア
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.totalRequests = 0;
    this.cacheHits = 0;
  }

  /**
   * 無効化（World変更時）
   */
  invalidate(): void {
    this.clear();
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * LRU削除
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder[0];
      this.delete(oldestKey);
    }
  }

  /**
   * アクセス順序更新
   */
  private updateAccessOrder(queryKey: string): void {
    const index = this.accessOrder.indexOf(queryKey);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(queryKey);
  }

  /**
   * キャッシュ統計
   */
  getStats(): CacheStats {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    this.cache.forEach(entry => {
      if (now - entry.timestamp <= this.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
      hitRate: this.totalRequests > 0 ? (this.cacheHits / this.totalRequests) * 100 : 0
    };
  }

  /**
   * キャッシュ設定を更新
   */
  updateSettings(options: Partial<QueryCacheOptions>): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
      // サイズが縮小された場合、余分なエントリを削除
      while (this.cache.size > this.maxSize) {
        this.evictLRU();
      }
    }
    
    if (options.ttl !== undefined) {
      this.ttl = options.ttl;
    }
    
    if (options.enabled !== undefined) {
      this.enabled = options.enabled;
      if (!this.enabled) {
        this.clear();
      }
    }
  }

  /**
   * デバッグ情報
   */
  debug(): void {
    console.log('[QueryCache] Debug Info:', {
      enabled: this.enabled,
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      hitRate: this.getStats().hitRate,
      accessOrder: this.accessOrder.slice(-5) // 最新5件のアクセス順序
    });
  }
}