/**
 * MemoryMonitor - ECSメモリ使用量監視クラス
 */

import type { IWorld } from '@/ecs/core/System';
import type {
  MemorySnapshot,
  MemoryTrend,
  MemoryLeakReport,
  MemoryOptimizationSuggestion,
  MemoryAlert,
  MemoryMonitorOptions
} from './types';

/**
 * MemoryMonitor
 * 
 * ECSシステムのメモリ使用量を監視し、メモリリーク検出、
 * 最適化提案、アラート機能を提供します。
 */
export class MemoryMonitor {
  private world: IWorld;
  private memorySnapshots: MemorySnapshot[];
  private memoryAlerts: MemoryAlert[];
  private monitoringInterval: NodeJS.Timeout | null;
  private maxSnapshots: number;

  constructor(world: IWorld, options: MemoryMonitorOptions = {}) {
    this.world = world;
    this.memorySnapshots = [];
    this.memoryAlerts = [];
    this.monitoringInterval = null;
    this.maxSnapshots = 1000;

    if (options.enableContinuousMonitoring) {
      this.startContinuousMonitoring(options.monitoringInterval || 1000);
    }
  }

  /**
   * メモリスナップショット取得
   */
  takeSnapshot(): MemorySnapshot {
    const timestamp = Date.now();
    const worldStats = this.getWorldStats();
    
    const snapshot: MemorySnapshot = {
      timestamp,
      totalMemory: this.getTotalMemoryUsage(),
      heapUsed: this.getHeapUsage(),
      heapTotal: this.getHeapTotal(),
      entityCount: worldStats.entityCount,
      componentCount: worldStats.componentCount,
      estimatedEntityMemory: this.estimateEntityMemory(),
      estimatedComponentMemory: this.estimateComponentMemory(),
      memoryPerEntity: worldStats.entityCount > 0 
        ? this.estimateEntityMemory() / worldStats.entityCount 
        : 0,
      memoryPerComponent: worldStats.componentCount > 0 
        ? this.estimateComponentMemory() / worldStats.componentCount 
        : 0,
      fragmentationRatio: this.calculateFragmentationRatio()
    };

    this.memorySnapshots.push(snapshot);
    this.trimSnapshots();
    
    // メモリアラートチェック
    this.checkMemoryAlerts(snapshot);

    return snapshot;
  }

  /**
   * 継続的監視開始
   */
  startContinuousMonitoring(interval: number = 1000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot();
    }, interval);
  }

  /**
   * 継続的監視停止
   */
  stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * メモリ使用量推移取得
   */
  getMemoryTrend(duration: number = 60000): MemoryTrend {
    const cutoffTime = Date.now() - duration;
    const recentSnapshots = this.memorySnapshots
      .filter(snapshot => snapshot.timestamp >= cutoffTime)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (recentSnapshots.length < 2) {
      return {
        trend: 'stable',
        changeRate: 0,
        peakMemory: 0,
        averageMemory: 0,
        snapshots: recentSnapshots
      };
    }

    const first = recentSnapshots[0];
    const last = recentSnapshots[recentSnapshots.length - 1];
    const timeDiff = last.timestamp - first.timestamp;
    const memoryDiff = last.totalMemory - first.totalMemory;
    
    const changeRate = timeDiff > 0 ? (memoryDiff / timeDiff) * 1000 : 0; // per second
    const peakMemory = Math.max(...recentSnapshots.map(s => s.totalMemory));
    const averageMemory = recentSnapshots.reduce((sum, s) => sum + s.totalMemory, 0) / recentSnapshots.length;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(changeRate) < 1024) { // 1KB/s 未満は安定
      trend = 'stable';
    } else if (changeRate > 0) {
      trend = 'increasing';
    } else {
      trend = 'decreasing';
    }

    return {
      trend,
      changeRate,
      peakMemory,
      averageMemory,
      snapshots: recentSnapshots
    };
  }

  /**
   * メモリリーク検出
   */
  detectMemoryLeaks(): MemoryLeakReport {
    const trend = this.getMemoryTrend(300000); // 5分間
    const isLeaking = trend.trend === 'increasing' && trend.changeRate > 1024; // 1KB/s以上の増加

    const suspiciousPatterns: string[] = [];
    
    if (isLeaking) {
      suspiciousPatterns.push('Continuous memory increase detected');
    }

    // エンティティ数とメモリ使用量の相関チェック
    const entityMemoryCorrelation = this.calculateEntityMemoryCorrelation();
    if (entityMemoryCorrelation < 0.7) {
      suspiciousPatterns.push('Poor correlation between entity count and memory usage');
    }

    // フラグメンテーション率チェック
    const latestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    if (latestSnapshot && latestSnapshot.fragmentationRatio > 0.3) {
      suspiciousPatterns.push('High memory fragmentation detected');
    }

    return {
      isLeaking,
      confidence: this.calculateLeakConfidence(trend, suspiciousPatterns),
      suspiciousPatterns,
      recommendation: this.generateMemoryRecommendations(trend, suspiciousPatterns),
      trend
    };
  }

  /**
   * メモリ最適化提案
   */
  getOptimizationSuggestions(): MemoryOptimizationSuggestion[] {
    const suggestions: MemoryOptimizationSuggestion[] = [];
    const latestSnapshot = this.memorySnapshots[this.memorySnapshots.length - 1];
    
    if (!latestSnapshot) return suggestions;

    // エンティティあたりのメモリ使用量チェック
    if (latestSnapshot.memoryPerEntity > 1024) { // 1KB/entity
      suggestions.push({
        type: 'entity-optimization',
        priority: 'high',
        description: 'High memory usage per entity detected',
        recommendation: 'Consider optimizing component data structures or reducing component count per entity',
        estimatedSaving: latestSnapshot.estimatedEntityMemory * 0.2
      });
    }

    // コンポーネントあたりのメモリ使用量チェック
    if (latestSnapshot.memoryPerComponent > 512) { // 512B/component
      suggestions.push({
        type: 'component-optimization',
        priority: 'medium',
        description: 'High memory usage per component detected',
        recommendation: 'Consider using more efficient data types or component pooling',
        estimatedSaving: latestSnapshot.estimatedComponentMemory * 0.15
      });
    }

    // フラグメンテーションチェック
    if (latestSnapshot.fragmentationRatio > 0.25) {
      suggestions.push({
        type: 'fragmentation-reduction',
        priority: 'medium',
        description: 'High memory fragmentation detected',
        recommendation: 'Consider implementing object pooling or periodic garbage collection',
        estimatedSaving: latestSnapshot.totalMemory * latestSnapshot.fragmentationRatio * 0.5
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * アラート取得
   */
  getAlerts(severity?: 'info' | 'warning' | 'error'): MemoryAlert[] {
    if (severity) {
      return this.memoryAlerts.filter(alert => alert.severity === severity);
    }
    return [...this.memoryAlerts];
  }

  /**
   * 統計リセット
   */
  resetStats(): void {
    this.memorySnapshots = [];
    this.memoryAlerts = [];
  }

  /**
   * プライベートメソッド群
   */
  private getWorldStats(): { entityCount: number; componentCount: number } {
    // World から統計情報を取得（実装は World の API に依存）
    try {
      const componentStats = this.world.getComponentStats?.() || {};
      const componentCount = Object.values(componentStats).reduce((sum: number, count: unknown) => {
        return sum + (typeof count === 'number' ? count : 0);
      }, 0);
      
      return {
        entityCount: this.world.getAllEntities?.()?.length || 0,
        componentCount
      };
    } catch {
      return { entityCount: 0, componentCount: 0 };
    }
  }

  private getTotalMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getHeapUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private getHeapTotal(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.totalJSHeapSize;
    }
    return 0;
  }

  private estimateEntityMemory(): number {
    const worldStats = this.getWorldStats();
    return worldStats.entityCount * 64; // 64 bytes per entity (推定)
  }

  private estimateComponentMemory(): number {
    const worldStats = this.getWorldStats();
    return worldStats.componentCount * 256; // 256 bytes per component (推定)
  }

  private calculateFragmentationRatio(): number {
    const heapUsed = this.getHeapUsage();
    const heapTotal = this.getHeapTotal();
    
    if (heapTotal === 0) return 0;
    
    // 簡易的なフラグメンテーション率計算
    return Math.max(0, (heapTotal - heapUsed) / heapTotal - 0.1); // 10%のバッファを考慮
  }

  private calculateEntityMemoryCorrelation(): number {
    if (this.memorySnapshots.length < 10) return 1.0;

    const recent = this.memorySnapshots.slice(-20);
    const entityCounts = recent.map(s => s.entityCount);
    const memoryUsages = recent.map(s => s.totalMemory);

    return this.calculateCorrelation(entityCounts, memoryUsages);
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateLeakConfidence(trend: MemoryTrend, patterns: string[]): number {
    let confidence = 0;

    if (trend.trend === 'increasing') {
      confidence += 0.4;
    }

    if (trend.changeRate > 2048) { // 2KB/s
      confidence += 0.3;
    }

    confidence += patterns.length * 0.1;

    return Math.min(1.0, confidence);
  }

  private generateMemoryRecommendations(trend: MemoryTrend, patterns: string[]): string[] {
    const recommendations: string[] = [];

    if (trend.trend === 'increasing') {
      recommendations.push('Monitor entity and component creation/destruction patterns');
      recommendations.push('Consider implementing object pooling for frequently created/destroyed objects');
    }

    if (patterns.includes('High memory fragmentation detected')) {
      recommendations.push('Implement periodic garbage collection or memory compaction');
    }

    if (patterns.includes('Poor correlation between entity count and memory usage')) {
      recommendations.push('Investigate potential memory leaks in component management');
    }

    return recommendations;
  }

  private checkMemoryAlerts(snapshot: MemorySnapshot): void {
    // メモリ使用量アラート
    const memoryThreshold = 100 * 1024 * 1024; // 100MB
    if (snapshot.totalMemory > memoryThreshold) {
      this.memoryAlerts.push({
        type: 'high-memory-usage',
        severity: 'warning',
        message: `High memory usage detected: ${(snapshot.totalMemory / 1024 / 1024).toFixed(2)}MB`,
        timestamp: snapshot.timestamp,
        value: snapshot.totalMemory,
        threshold: memoryThreshold
      });
    }

    // フラグメンテーションアラート
    if (snapshot.fragmentationRatio > 0.3) {
      this.memoryAlerts.push({
        type: 'high-fragmentation',
        severity: 'info',
        message: `High memory fragmentation: ${(snapshot.fragmentationRatio * 100).toFixed(1)}%`,
        timestamp: snapshot.timestamp,
        value: snapshot.fragmentationRatio,
        threshold: 0.3
      });
    }

    this.trimAlerts();
  }

  private trimSnapshots(): void {
    if (this.memorySnapshots.length > this.maxSnapshots) {
      this.memorySnapshots = this.memorySnapshots.slice(-this.maxSnapshots);
    }
  }

  private trimAlerts(): void {
    const maxAlerts = 100;
    if (this.memoryAlerts.length > maxAlerts) {
      this.memoryAlerts = this.memoryAlerts.slice(-maxAlerts);
    }
  }
}