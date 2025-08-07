/**
 * EntityMonitor - ECSエンティティライフサイクル監視クラス
 */

import type { IWorld } from '@/ecs/core/System';
import type { EntityId } from '@/ecs/core/Entity';
import type { ComponentType } from '@/ecs/core/Component';
import type {
  EntityLifecycleStats,
  EntityCreationRecord,
  EntityDestructionRecord,
  ComponentUsageStats,
  EntityCreationAnalysis,
  MemoryEfficiencyAnalysis,
  PerformanceImpactAnalysis,
  EntityCreationPattern
} from './types';

/**
 * EntityMonitor
 * 
 * エンティティのライフサイクル、作成パターン、メモリ効率、
 * パフォーマンス影響を監視・分析します。
 */
export class EntityMonitor {
  private world: IWorld;
  private entityLifecycleStats: EntityLifecycleStats;
  private componentUsageStats: Map<ComponentType, ComponentUsageStats>;
  private entityCreationHistory: EntityCreationRecord[];
  private entityDestructionHistory: EntityDestructionRecord[];
  private entityLifespans: Map<EntityId, number>; // 作成時刻を記録

  constructor(world: IWorld) {
    this.world = world;
    this.entityLifecycleStats = this.initializeLifecycleStats();
    this.componentUsageStats = new Map();
    this.entityCreationHistory = [];
    this.entityDestructionHistory = [];
    this.entityLifespans = new Map();

    this.setupLifecycleListeners();
  }

  /**
   * エンティティ作成記録
   */
  recordEntityCreation(entityId: EntityId): void {
    const timestamp = Date.now();
    const record: EntityCreationRecord = {
      entityId,
      timestamp,
      componentCount: this.getEntityComponentCount(entityId),
      memoryEstimate: this.estimateEntityMemory(entityId)
    };

    this.entityCreationHistory.push(record);
    this.entityLifespans.set(entityId, timestamp);
    this.trimCreationHistory();

    // 統計更新
    this.entityLifecycleStats.totalCreated++;
    this.entityLifecycleStats.currentActive++;
    this.entityLifecycleStats.peakActive = Math.max(
      this.entityLifecycleStats.peakActive,
      this.entityLifecycleStats.currentActive
    );
    this.entityLifecycleStats.creationRate = this.calculateCreationRate();
  }

  /**
   * エンティティ削除記録
   */
  recordEntityDestruction(entityId: EntityId): void {
    const timestamp = Date.now();
    const lifespan = this.calculateEntityLifespan(entityId);
    
    const record: EntityDestructionRecord = {
      entityId,
      timestamp,
      lifespan,
      componentCount: this.getEntityComponentCount(entityId)
    };

    this.entityDestructionHistory.push(record);
    this.entityLifespans.delete(entityId);
    this.trimDestructionHistory();

    // 統計更新
    this.entityLifecycleStats.totalDestroyed++;
    this.entityLifecycleStats.currentActive--;
    this.entityLifecycleStats.destructionRate = this.calculateDestructionRate();
    this.entityLifecycleStats.averageLifespan = this.calculateAverageLifespan();
  }

  /**
   * コンポーネント使用統計更新
   */
  recordComponentUsage(componentType: ComponentType, operation: 'add' | 'remove'): void {
    let stats = this.componentUsageStats.get(componentType);
    
    if (!stats) {
      stats = {
        componentType,
        totalAdded: 0,
        totalRemoved: 0,
        currentCount: 0,
        peakCount: 0,
        averageLifespan: 0,
        additionRate: 0,
        removalRate: 0
      };
      this.componentUsageStats.set(componentType, stats);
    }

    if (operation === 'add') {
      stats.totalAdded++;
      stats.currentCount++;
      stats.peakCount = Math.max(stats.peakCount, stats.currentCount);
    } else {
      stats.totalRemoved++;
      stats.currentCount--;
    }

    stats.additionRate = this.calculateComponentAdditionRate(componentType);
    stats.removalRate = this.calculateComponentRemovalRate(componentType);
  }

  /**
   * エンティティ統計取得
   */
  getEntityStats(): EntityLifecycleStats {
    return { ...this.entityLifecycleStats };
  }

  /**
   * コンポーネント統計取得
   */
  getComponentUsageStats(componentType?: ComponentType): ComponentUsageStats[] {
    if (componentType) {
      const stats = this.componentUsageStats.get(componentType);
      return stats ? [stats] : [];
    }
    return Array.from(this.componentUsageStats.values());
  }

  /**
   * エンティティ作成パターン分析
   */
  analyzeCreationPatterns(): EntityCreationAnalysis {
    const recentCreations = this.entityCreationHistory.slice(-100);
    
    if (recentCreations.length < 2) {
      return {
        pattern: 'insufficient-data',
        burstDetected: false,
        averageInterval: 0,
        peakCreationRate: 0,
        recommendations: ['Insufficient data for pattern analysis']
      };
    }

    // 作成間隔分析
    const intervals = [];
    for (let i = 1; i < recentCreations.length; i++) {
      intervals.push(recentCreations[i].timestamp - recentCreations[i - 1].timestamp);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const intervalVariance = this.calculateVariance(intervals);
    
    // バースト検出
    const shortIntervals = intervals.filter(interval => interval < averageInterval * 0.1);
    const burstDetected = shortIntervals.length > intervals.length * 0.2;

    // パターン判定
    let pattern: EntityCreationPattern;
    if (intervalVariance < averageInterval * 0.1) {
      pattern = 'steady';
    } else if (burstDetected) {
      pattern = 'bursty';
    } else {
      pattern = 'irregular';
    }

    const peakCreationRate = Math.min(...intervals.filter(i => i > 0));

    return {
      pattern,
      burstDetected,
      averageInterval,
      peakCreationRate: 1000 / peakCreationRate, // entities per second
      recommendations: this.generateCreationRecommendations(pattern, burstDetected)
    };
  }

  /**
   * メモリ効率分析
   */
  analyzeMemoryEfficiency(): MemoryEfficiencyAnalysis {
    const currentEntities = this.getCurrentEntities();
    const totalMemory = currentEntities.reduce((sum, entityId) => 
      sum + this.estimateEntityMemory(entityId), 0);
    
    const averageMemoryPerEntity = currentEntities.length > 0 
      ? totalMemory / currentEntities.length 
      : 0;

    // コンポーネント別メモリ使用量
    const componentMemoryUsage: Record<ComponentType, number> = {} as Record<ComponentType, number>;
    
    // 効率性評価
    const efficiency = this.calculateMemoryEfficiency(averageMemoryPerEntity);
    
    return {
      totalMemoryUsage: totalMemory,
      averageMemoryPerEntity,
      componentMemoryBreakdown: componentMemoryUsage,
      efficiency,
      recommendations: this.generateMemoryEfficiencyRecommendations(efficiency)
    };
  }

  /**
   * パフォーマンス影響分析
   */
  analyzePerformanceImpact(): PerformanceImpactAnalysis {
    const currentEntities = this.getCurrentEntities();
    const entityCount = currentEntities.length;
    const componentStats = this.getComponentStats();
    const totalComponents = Object.values(componentStats).reduce((sum, count) => sum + count, 0);

    // エンティティ密度計算
    const entityDensity = entityCount > 0 ? totalComponents / entityCount : 0;

    // パフォーマンス予測
    const predictedQueryTime = this.predictQueryPerformance(entityCount, entityDensity);
    const predictedUpdateTime = this.predictUpdatePerformance(entityCount, entityDensity);

    // ボトルネック識別
    const bottlenecks = this.identifyBottlenecks(entityCount, componentStats);

    return {
      entityCount,
      componentCount: totalComponents,
      entityDensity,
      predictedQueryTime,
      predictedUpdateTime,
      bottlenecks,
      recommendations: this.generatePerformanceRecommendations(bottlenecks)
    };
  }

  /**
   * 統計リセット
   */
  resetStats(): void {
    this.entityLifecycleStats = this.initializeLifecycleStats();
    this.componentUsageStats.clear();
    this.entityCreationHistory = [];
    this.entityDestructionHistory = [];
    this.entityLifespans.clear();
  }

  /**
   * プライベートメソッド群
   */
  private setupLifecycleListeners(): void {
    // World のライフサイクルイベントをリッスン
    // 実装は World の EventBus 統合に依存
  }

  private initializeLifecycleStats(): EntityLifecycleStats {
    return {
      totalCreated: 0,
      totalDestroyed: 0,
      currentActive: 0,
      peakActive: 0,
      creationRate: 0,
      destructionRate: 0,
      averageLifespan: 0
    };
  }

  private calculateCreationRate(): number {
    const recentCreations = this.entityCreationHistory.slice(-10);
    if (recentCreations.length < 2) return 0;

    const timeSpan = recentCreations[recentCreations.length - 1].timestamp - recentCreations[0].timestamp;
    return timeSpan > 0 ? (recentCreations.length - 1) / (timeSpan / 1000) : 0;
  }

  private calculateDestructionRate(): number {
    const recentDestructions = this.entityDestructionHistory.slice(-10);
    if (recentDestructions.length < 2) return 0;

    const timeSpan = recentDestructions[recentDestructions.length - 1].timestamp - recentDestructions[0].timestamp;
    return timeSpan > 0 ? (recentDestructions.length - 1) / (timeSpan / 1000) : 0;
  }

  private calculateAverageLifespan(): number {
    if (this.entityDestructionHistory.length === 0) return 0;

    const totalLifespan = this.entityDestructionHistory.reduce((sum, record) => sum + record.lifespan, 0);
    return totalLifespan / this.entityDestructionHistory.length;
  }

  private calculateEntityLifespan(entityId: EntityId): number {
    const creationTime = this.entityLifespans.get(entityId);
    return creationTime ? Date.now() - creationTime : 0;
  }

  private getEntityComponentCount(entityId: EntityId): number {
    // World API を使用してエンティティのコンポーネント数を取得
    try {
      return this.world.getEntity?.(entityId)?.components?.size || 0;
    } catch {
      return 0;
    }
  }

  private estimateEntityMemory(entityId: EntityId): number {
    // エンティティのメモリ使用量を推定
    const componentCount = this.getEntityComponentCount(entityId);
    return 64 + (componentCount * 256); // 基本64B + コンポーネント256B/個
  }

  private getCurrentEntities(): EntityId[] {
    try {
      return this.world.getAllEntities?.() || [];
    } catch {
      return [];
    }
  }

  private getComponentStats(): Record<string, number> {
    try {
      return this.world.getComponentStats?.() || {};
    } catch {
      return {};
    }
  }

  private calculateComponentAdditionRate(_componentType: ComponentType): number {
    // 実装: コンポーネント追加レートの計算
    return 0;
  }

  private calculateComponentRemovalRate(_componentType: ComponentType): number {
    // 実装: コンポーネント削除レートの計算
    return 0;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private generateCreationRecommendations(pattern: EntityCreationPattern, burstDetected: boolean): string[] {
    const recommendations: string[] = [];

    switch (pattern) {
      case 'bursty':
        recommendations.push('Consider implementing entity pooling to handle burst creation');
        recommendations.push('Monitor memory usage during burst periods');
        break;
      case 'irregular':
        recommendations.push('Analyze entity creation triggers for optimization opportunities');
        break;
      case 'steady':
        recommendations.push('Current creation pattern is optimal');
        break;
    }

    if (burstDetected) {
      recommendations.push('Implement rate limiting for entity creation if necessary');
    }

    return recommendations;
  }

  private calculateMemoryEfficiency(averageMemoryPerEntity: number): number {
    // メモリ効率を0-100のスコアで計算
    const baselineMemory = 512; // 512B を基準とする
    return Math.max(0, 100 - (averageMemoryPerEntity / baselineMemory) * 50);
  }

  private generateMemoryEfficiencyRecommendations(efficiency: number): string[] {
    const recommendations: string[] = [];

    if (efficiency < 50) {
      recommendations.push('High memory usage per entity detected');
      recommendations.push('Consider optimizing component data structures');
      recommendations.push('Implement component pooling for frequently used components');
    } else if (efficiency < 75) {
      recommendations.push('Moderate memory usage - consider minor optimizations');
    } else {
      recommendations.push('Memory usage is efficient');
    }

    return recommendations;
  }

  private predictQueryPerformance(entityCount: number, entityDensity: number): number {
    // クエリパフォーマンスを予測（ミリ秒）
    return Math.max(0.1, entityCount * 0.01 + entityDensity * 0.005);
  }

  private predictUpdatePerformance(entityCount: number, entityDensity: number): number {
    // 更新パフォーマンスを予測（ミリ秒）
    return Math.max(0.5, entityCount * 0.05 + entityDensity * 0.02);
  }

  private identifyBottlenecks(entityCount: number, componentStats: Record<string, number>): string[] {
    const bottlenecks: string[] = [];

    if (entityCount > 100) {
      bottlenecks.push('High entity count may impact query performance');
    }

    const maxComponentCount = Math.max(...Object.values(componentStats));
    if (maxComponentCount > 50) {
      bottlenecks.push('High component count detected for some types');
    }

    return bottlenecks;
  }

  private generatePerformanceRecommendations(bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    bottlenecks.forEach(bottleneck => {
      if (bottleneck.includes('entity count')) {
        recommendations.push('Consider entity culling or spatial partitioning');
      }
      if (bottleneck.includes('component count')) {
        recommendations.push('Implement component pooling or archetype optimization');
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }

    return recommendations;
  }

  private trimCreationHistory(): void {
    const maxHistory = 1000;
    if (this.entityCreationHistory.length > maxHistory) {
      this.entityCreationHistory = this.entityCreationHistory.slice(-maxHistory);
    }
  }

  private trimDestructionHistory(): void {
    const maxHistory = 1000;
    if (this.entityDestructionHistory.length > maxHistory) {
      this.entityDestructionHistory = this.entityDestructionHistory.slice(-maxHistory);
    }
  }
}