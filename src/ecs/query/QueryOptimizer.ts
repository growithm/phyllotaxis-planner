/**
 * クエリ最適化エンジン
 */

import { ComponentType } from '@/ecs/core/Component';
import { QueryFilter, OptimizedQuery, ExecutionStep, QueryPerformanceStats, SpatialQuery } from './types/QueryTypes';
import { EntityIndex } from './EntityIndex';

/**
 * 最適化ルール
 */
interface OptimizationRule {
  name: string;
  condition: (filter: QueryFilter) => boolean;
  transform: (filter: QueryFilter) => QueryFilter;
}

/**
 * 最適化設定オプション
 */
export interface OptimizerOptions {
  enableOptimization?: boolean;
  collectStats?: boolean;
  maxExecutionTime?: number;
}

/**
 * クエリ最適化エンジン
 */
export class QueryOptimizer {
  private optimizationRules: OptimizationRule[];
  private queryStats: Map<string, QueryPerformanceStats>;
  private componentSelectivity: Map<ComponentType, number>;
  private options: OptimizerOptions;

  constructor(options: OptimizerOptions = {}) {
    this.options = {
      enableOptimization: true,
      collectStats: true,
      maxExecutionTime: 50,
      ...options
    };
    
    this.optimizationRules = this.createOptimizationRules();
    this.queryStats = new Map();
    this.componentSelectivity = new Map();
  }

  /**
   * クエリ最適化
   */
  optimize(filter: QueryFilter, entityIndex: EntityIndex): OptimizedQuery {
    if (!this.options.enableOptimization) {
      return {
        filter,
        executionPlan: this.createBasicExecutionPlan(filter),
        estimatedCost: 100 // デフォルトコスト
      };
    }

    let optimizedFilter = { ...filter };
    
    // 最適化ルール適用
    this.optimizationRules.forEach(rule => {
      if (rule.condition(optimizedFilter)) {
        optimizedFilter = rule.transform(optimizedFilter);
      }
    });

    // 実行計画生成
    const executionPlan = this.createExecutionPlan(optimizedFilter, entityIndex);

    return {
      filter: optimizedFilter,
      executionPlan,
      estimatedCost: this.estimateCost(executionPlan)
    };
  }

  /**
   * 最適化ルール作成
   */
  private createOptimizationRules(): OptimizationRule[] {
    return [
      // ルール1: 最も選択性の高いコンポーネントを最初に処理
      {
        name: 'selectivity-optimization',
        condition: (filter) => !!(filter.all && filter.all.length > 1),
        transform: (filter) => {
          if (filter.all) {
            // 選択性の高い順にソート
            const sortedComponents = [...filter.all].sort((a, b) => 
              this.getComponentSelectivity(a) - this.getComponentSelectivity(b)
            );
            return { ...filter, all: sortedComponents };
          }
          return filter;
        }
      },

      // ルール2: 空間クエリの最適化
      {
        name: 'spatial-optimization',
        condition: (filter) => 'spatial' in filter,
        transform: (filter) => {
          // 空間クエリを最初に実行するように調整
          return filter;
        }
      },

      // ルール3: 範囲クエリの最適化
      {
        name: 'range-optimization',
        condition: (filter) => 'range' in filter,
        transform: (filter) => {
          // 範囲クエリの順序最適化
          return filter;
        }
      },

      // ルール4: 制限とオフセットの最適化
      {
        name: 'limit-optimization',
        condition: (filter) => filter.limit !== undefined && filter.limit < 10,
        transform: (filter) => {
          // 小さなlimitの場合は早期終了を有効化
          return filter;
        }
      }
    ];
  }

  /**
   * 実行計画生成
   */
  private createExecutionPlan(filter: QueryFilter, entityIndex: EntityIndex): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    // ステップ1: 最も選択性の高いフィルターから開始
    if (filter.all && filter.all.length > 0) {
      const primaryComponent = filter.all[0];
      steps.push({
        type: 'component-filter',
        component: primaryComponent,
        estimatedResults: entityIndex.getEntitiesWithComponent(primaryComponent).size
      });

      // 残りのコンポーネントでフィルタリング
      filter.all.slice(1).forEach(component => {
        steps.push({
          type: 'intersect',
          component,
          estimatedResults: Math.min(
            steps[steps.length - 1].estimatedResults,
            entityIndex.getEntitiesWithComponent(component).size
          )
        });
      });
    }

    // ステップ2: 空間フィルター
    if ('spatial' in filter) {
      const advancedFilter = filter as { spatial?: SpatialQuery };
      if (advancedFilter.spatial) {
        steps.push({
          type: 'spatial-filter',
          spatial: advancedFilter.spatial,
          estimatedResults: this.estimateSpatialResults(advancedFilter.spatial)
        });
      }
    }

    // ステップ3: カスタム条件
    if (filter.where) {
      steps.push({
        type: 'custom-filter',
        estimatedResults: Math.floor((steps[steps.length - 1]?.estimatedResults || 10) * 0.5)
      });
    }

    // ステップ4: ソート
    if (filter.orderBy && filter.orderBy.length > 0) {
      steps.push({
        type: 'sort',
        orderBy: filter.orderBy,
        estimatedResults: steps[steps.length - 1]?.estimatedResults || 0
      });
    }

    return steps;
  }

  /**
   * 基本実行計画生成（最適化なし）
   */
  private createBasicExecutionPlan(filter: QueryFilter): ExecutionStep[] {
    const steps: ExecutionStep[] = [];

    if (filter.all && filter.all.length > 0) {
      steps.push({
        type: 'component-filter',
        component: filter.all[0],
        estimatedResults: 50 // デフォルト見積もり
      });
    }

    return steps;
  }

  /**
   * コスト見積もり
   */
  private estimateCost(executionPlan: ExecutionStep[]): number {
    return executionPlan.reduce((totalCost, step) => {
      switch (step.type) {
        case 'component-filter':
          return totalCost + 1; // インデックスアクセスは低コスト
        case 'intersect':
          return totalCost + step.estimatedResults * 0.1;
        case 'spatial-filter':
          return totalCost + step.estimatedResults * 0.5;
        case 'custom-filter':
          return totalCost + step.estimatedResults * 2; // カスタム条件は高コスト
        case 'sort':
          return totalCost + step.estimatedResults * Math.log2(Math.max(step.estimatedResults, 1));
        default:
          return totalCost + step.estimatedResults;
      }
    }, 0);
  }

  /**
   * コンポーネント選択性取得
   */
  private getComponentSelectivity(component: ComponentType): number {
    // キャッシュされた選択性を返す
    const cached = this.componentSelectivity.get(component);
    if (cached !== undefined) {
      return cached;
    }

    // デフォルト選択性（実際の統計情報に基づいて更新される）
    const defaultSelectivity = 1.0;
    this.componentSelectivity.set(component, defaultSelectivity);
    return defaultSelectivity;
  }

  /**
   * 空間クエリ結果見積もり
   */
  private estimateSpatialResults(spatial: SpatialQuery): number {
    switch (spatial.type) {
      case 'circle':
        const radius = spatial.radius || 100;
        return Math.floor(Math.PI * Math.pow(radius, 2) / 10000);
      case 'rectangle':
        const bounds = spatial.bounds!;
        return Math.floor((bounds.x2 - bounds.x1) * (bounds.y2 - bounds.y1) / 10000);
      case 'polygon':
        // 簡易的な多角形面積見積もり
        return Math.floor((spatial.points?.length || 3) * 10);
      default:
        return 10;
    }
  }

  /**
   * クエリ統計記録
   */
  recordQueryStats(queryKey: string, executionTime: number, resultCount: number): void {
    if (!this.options.collectStats) {
      return;
    }

    const existing = this.queryStats.get(queryKey);
    if (existing) {
      existing.executionCount++;
      existing.totalExecutionTime += executionTime;
      existing.averageExecutionTime = existing.totalExecutionTime / existing.executionCount;
      existing.lastResultCount = resultCount;
    } else {
      this.queryStats.set(queryKey, {
        executionCount: 1,
        totalExecutionTime: executionTime,
        averageExecutionTime: executionTime,
        lastResultCount: resultCount
      });
    }
  }

  /**
   * コンポーネント選択性を更新
   */
  updateComponentSelectivity(component: ComponentType, selectivity: number): void {
    this.componentSelectivity.set(component, selectivity);
  }

  /**
   * 統計情報取得
   */
  getQueryStats(): Map<string, QueryPerformanceStats> {
    return new Map(this.queryStats);
  }

  /**
   * 最適化統計をリセット
   */
  resetStats(): void {
    this.queryStats.clear();
    this.componentSelectivity.clear();
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.resetStats();
  }

  /**
   * デバッグ情報
   */
  debug(): void {
    console.log('[QueryOptimizer] Debug Info:', {
      optimizationEnabled: this.options.enableOptimization,
      rulesCount: this.optimizationRules.length,
      statsCount: this.queryStats.size,
      selectivityCache: Object.fromEntries(this.componentSelectivity)
    });
  }
}