/**
 * ECS QuerySystem - 高性能なエンティティクエリシステム
 */

import { IWorld } from '@/ecs/core/System';
import { QueryFilter, AdvancedQueryFilter, QueryResult } from './types/QueryTypes';
import { QueryBuilder } from './QueryBuilder';
import { EntityIndex } from './EntityIndex';
import { QueryCache } from './QueryCache';
import { QueryOptimizer } from './QueryOptimizer';
import { QueryEngine } from './QueryEngine';

/**
 * QuerySystemの設定オプション
 */
export interface QuerySystemOptions {
  // キャッシュ設定
  cacheOptions?: {
    maxSize?: number;
    ttl?: number;
    enabled?: boolean;
  };

  // インデックス設定
  indexOptions?: {
    enableSpatialIndex?: boolean;
    enableCompositeIndex?: boolean;
    spatialBounds?: { x: number; y: number; width: number; height: number };
  };

  // 最適化設定
  optimizationOptions?: {
    enableOptimization?: boolean;
    collectStats?: boolean;
    maxExecutionTime?: number;
  };

  // デバッグ設定
  debugOptions?: {
    enableLogging?: boolean;
    logSlowQueries?: boolean;
    slowQueryThreshold?: number;
  };
}

/**
 * QuerySystemの統計情報
 */
export interface QuerySystemStats {
  totalQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  indexStats: import('./EntityIndex').IndexStats;
  cacheStats: import('./QueryCache').CacheStats;
}

/**
 * 高性能なエンティティクエリシステム
 */
export class QuerySystem {
  private world: IWorld;
  private queryEngine: QueryEngine;
  private queryCache: QueryCache;
  private entityIndex: EntityIndex;
  private queryOptimizer: QueryOptimizer;
  private options: QuerySystemOptions;
  
  // 統計情報
  private totalQueries: number = 0;
  private totalExecutionTime: number = 0;

  constructor(world: IWorld, options: QuerySystemOptions = {}) {
    this.world = world;
    this.options = this.mergeDefaultOptions(options);
    
    // コンポーネント初期化
    this.queryCache = new QueryCache(this.options.cacheOptions);
    this.entityIndex = new EntityIndex(world, this.options.indexOptions);
    this.queryOptimizer = new QueryOptimizer(this.options.optimizationOptions);
    this.queryEngine = new QueryEngine(world, this.entityIndex, this.queryOptimizer);
    
    this.setupIndexListeners();
  }

  /**
   * デフォルトオプションとマージ
   */
  private mergeDefaultOptions(options: QuerySystemOptions): QuerySystemOptions {
    return {
      cacheOptions: {
        maxSize: 100,
        ttl: 5000,
        enabled: true,
        ...options.cacheOptions
      },
      indexOptions: {
        enableSpatialIndex: true,
        enableCompositeIndex: true,
        spatialBounds: { x: 0, y: 0, width: 1000, height: 1000 },
        ...options.indexOptions
      },
      optimizationOptions: {
        enableOptimization: true,
        collectStats: true,
        maxExecutionTime: 50,
        ...options.optimizationOptions
      },
      debugOptions: {
        enableLogging: process.env.NODE_ENV === 'development',
        logSlowQueries: true,
        slowQueryThreshold: 10,
        ...options.debugOptions
      }
    };
  }

  /**
   * インデックス更新リスナーをセットアップ
   */
  private setupIndexListeners(): void {
    // World変更時にキャッシュを無効化
    const worldVersion = this.world.getVersion?.();
    if (worldVersion !== undefined) {
      // バージョン変更監視は後で実装
    }
  }

  /**
   * 基本的なクエリを実行
   */
  query(filter: QueryFilter): QueryResult {
    const startTime = performance.now();
    this.totalQueries++;

    try {
      // キャッシュチェック
      const queryKey = this.generateQueryKey(filter);
      if (this.options.cacheOptions?.enabled) {
        const cachedResult = this.queryCache.get(queryKey);
        if (cachedResult) {
          const executionTime = performance.now() - startTime;
          return {
            entities: cachedResult,
            totalCount: cachedResult.length,
            executionTime,
            fromCache: true,
            queryStats: {
              stepsExecuted: 0,
              entitiesScanned: 0,
              indexHits: 1,
              cacheHit: true,
              optimizationApplied: []
            }
          };
        }
      }

      // クエリ実行
      const result = this.queryEngine.execute(filter);
      const executionTime = performance.now() - startTime;

      // 統計更新
      this.totalExecutionTime += executionTime;
      if (this.options.optimizationOptions?.collectStats) {
        this.queryOptimizer.recordQueryStats(queryKey, executionTime, result.entities.length);
      }

      // キャッシュに保存
      if (this.options.cacheOptions?.enabled) {
        this.queryCache.set(queryKey, result.entities);
      }

      // スロークエリのログ
      if (this.options.debugOptions?.logSlowQueries && 
          executionTime > (this.options.debugOptions.slowQueryThreshold || 10)) {
        console.warn(`[QuerySystem] Slow query detected: ${executionTime.toFixed(2)}ms`, filter);
      }

      return {
        ...result,
        executionTime,
        fromCache: false
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error('[QuerySystem] Query execution failed:', error);
      
      return {
        entities: [],
        totalCount: 0,
        executionTime,
        fromCache: false,
        queryStats: {
          stepsExecuted: 0,
          entitiesScanned: 0,
          indexHits: 0,
          cacheHit: false,
          optimizationApplied: []
        }
      };
    }
  }

  /**
   * 高度なクエリを実行
   */
  queryAdvanced(filter: AdvancedQueryFilter): QueryResult {
    return this.query(filter);
  }

  /**
   * QueryBuilderを作成
   */
  createBuilder(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * クエリキャッシュを無効化
   */
  invalidateCache(): void {
    this.queryCache.invalidate();
    this.entityIndex.forceUpdate();
  }

  /**
   * 統計情報を取得
   */
  getStats(): QuerySystemStats {
    return {
      totalQueries: this.totalQueries,
      cacheHitRate: this.calculateCacheHitRate(),
      averageExecutionTime: this.totalQueries > 0 ? this.totalExecutionTime / this.totalQueries : 0,
      indexStats: this.entityIndex.getIndexStats(),
      cacheStats: this.queryCache.getStats()
    };
  }

  /**
   * 設定を更新
   */
  updateSettings(options: Partial<QuerySystemOptions>): void {
    this.options = this.mergeDefaultOptions({ ...this.options, ...options });
    
    // 各コンポーネントの設定を更新
    if (options.cacheOptions) {
      // QueryCacheの設定更新は後で実装
    }
    
    if (options.indexOptions) {
      // EntityIndexの設定更新は後で実装
    }
  }

  /**
   * クエリキーを生成
   */
  private generateQueryKey(filter: QueryFilter): string {
    return JSON.stringify(filter, Object.keys(filter).sort());
  }

  /**
   * キャッシュヒット率を計算
   */
  private calculateCacheHitRate(): number {
    const cacheStats = this.queryCache.getStats();
    return cacheStats.hitRate;
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.queryCache.clear();
    this.entityIndex.cleanup?.();
    this.queryOptimizer.cleanup?.();
  }
}