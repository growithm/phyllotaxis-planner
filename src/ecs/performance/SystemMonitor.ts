/**
 * SystemMonitor - ECSシステム実行監視クラス
 */

import type { IWorld } from '@/ecs/core/System';
import type {
  ExecutionToken,
  ExecutionContext,
  SystemExecutionRecord,
  SystemExecutionResult,
  SystemMetrics
} from './types';

/**
 * SystemMonitor
 * 
 * ECSシステムの実行時間、処理エンティティ数、メモリ使用量を監視し、
 * パフォーマンス統計を収集・分析します。
 */
export class SystemMonitor {
  private world: IWorld;
  private systemMetrics: Map<string, SystemMetrics>;
  private executionHistory: SystemExecutionRecord[];
  private currentExecution: Map<ExecutionToken, ExecutionContext>;
  private maxHistorySize: number;

  constructor(world: IWorld, maxHistorySize: number = 1000) {
    this.world = world;
    this.systemMetrics = new Map();
    this.executionHistory = [];
    this.currentExecution = new Map();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * システム実行開始の監視
   */
  startSystemExecution(systemName: string): ExecutionToken {
    const token = this.generateExecutionToken();
    const context: ExecutionContext = {
      systemName,
      startTime: performance.now(),
      startMemory: this.getCurrentMemoryUsage(),
      token
    };

    this.currentExecution.set(token, context);
    return token;
  }

  /**
   * システム実行終了の監視
   */
  endSystemExecution(token: ExecutionToken, processedEntities: number = 0): SystemExecutionResult {
    const context = this.currentExecution.get(token);
    if (!context) {
      throw new Error(`Invalid execution token: ${token}`);
    }

    const endTime = performance.now();
    const endMemory = this.getCurrentMemoryUsage();
    const executionTime = endTime - context.startTime;
    const memoryDelta = endMemory - context.startMemory;

    // 実行記録作成
    const record: SystemExecutionRecord = {
      systemName: context.systemName,
      startTime: context.startTime,
      endTime,
      executionTime,
      processedEntities,
      memoryUsage: endMemory,
      memoryDelta,
      timestamp: new Date()
    };

    // 履歴に追加
    this.executionHistory.push(record);
    this.trimExecutionHistory();

    // メトリクス更新
    this.updateSystemMetrics(context.systemName, record);

    // 実行コンテキスト削除
    this.currentExecution.delete(token);

    return {
      executionTime,
      memoryDelta,
      processedEntities,
      performanceScore: this.calculatePerformanceScore(record)
    };
  }

  /**
   * システムメトリクス取得
   */
  getSystemMetrics(systemName?: string): SystemMetrics[] {
    if (systemName) {
      const metrics = this.systemMetrics.get(systemName);
      return metrics ? [metrics] : [];
    }
    return Array.from(this.systemMetrics.values());
  }

  /**
   * 最近の実行記録取得
   */
  getRecentExecutions(systemName: string, count: number = 50): SystemExecutionRecord[] {
    return this.executionHistory
      .filter(record => record.systemName === systemName)
      .slice(-count);
  }

  /**
   * 遅いシステム検出
   */
  getSlowSystems(threshold: number = 5.0): SystemMetrics[] {
    return Array.from(this.systemMetrics.values())
      .filter(metrics => metrics.averageExecutionTime > threshold)
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime);
  }

  /**
   * メモリ使用量の多いシステム検出
   */
  getMemoryIntensiveSystems(threshold: number = 10 * 1024 * 1024): SystemMetrics[] {
    return Array.from(this.systemMetrics.values())
      .filter(metrics => metrics.averageMemoryUsage > threshold)
      .sort((a, b) => b.averageMemoryUsage - a.averageMemoryUsage);
  }

  /**
   * 全システムの統計サマリー取得
   */
  getSystemsSummary(): {
    totalSystems: number;
    averagePerformanceScore: number;
    totalExecutions: number;
    totalExecutionTime: number;
  } {
    const allMetrics = Array.from(this.systemMetrics.values());
    
    if (allMetrics.length === 0) {
      return {
        totalSystems: 0,
        averagePerformanceScore: 100,
        totalExecutions: 0,
        totalExecutionTime: 0
      };
    }

    const totalExecutions = allMetrics.reduce((sum, m) => sum + m.totalExecutions, 0);
    const totalExecutionTime = allMetrics.reduce((sum, m) => sum + m.totalExecutionTime, 0);
    const averagePerformanceScore = allMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / allMetrics.length;

    return {
      totalSystems: allMetrics.length,
      averagePerformanceScore,
      totalExecutions,
      totalExecutionTime
    };
  }

  /**
   * 統計リセット
   */
  resetStats(): void {
    this.systemMetrics.clear();
    this.executionHistory = [];
    this.currentExecution.clear();
  }

  /**
   * システムメトリクス更新
   */
  private updateSystemMetrics(systemName: string, record: SystemExecutionRecord): void {
    let metrics = this.systemMetrics.get(systemName);
    
    if (!metrics) {
      metrics = {
        systemName,
        totalExecutions: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
        totalProcessedEntities: 0,
        averageProcessedEntities: 0,
        totalMemoryUsage: 0,
        averageMemoryUsage: 0,
        lastExecution: null,
        performanceScore: 100,
        alertCount: 0
      };
      this.systemMetrics.set(systemName, metrics);
    }

    // 統計更新
    metrics.totalExecutions++;
    metrics.totalExecutionTime += record.executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.totalExecutions;
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, record.executionTime);
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, record.executionTime);
    
    metrics.totalProcessedEntities += record.processedEntities;
    metrics.averageProcessedEntities = metrics.totalProcessedEntities / metrics.totalExecutions;
    
    metrics.totalMemoryUsage += record.memoryUsage;
    metrics.averageMemoryUsage = metrics.totalMemoryUsage / metrics.totalExecutions;
    
    metrics.lastExecution = record;
    metrics.performanceScore = this.calculateSystemPerformanceScore(metrics);

    // アラートチェック
    if (record.executionTime > 10.0) { // 10ms以上で警告
      metrics.alertCount++;
    }
  }

  /**
   * パフォーマンススコア計算
   */
  private calculatePerformanceScore(record: SystemExecutionRecord): number {
    // 基準値との比較でスコア算出
    const baseExecutionTime = 1.0; // 1ms を基準
    const baseMemoryUsage = 1024 * 1024; // 1MB を基準

    const timeScore = Math.max(0, 100 - (record.executionTime / baseExecutionTime) * 10);
    const memoryScore = Math.max(0, 100 - (record.memoryUsage / baseMemoryUsage) * 10);
    const entityEfficiency = record.processedEntities > 0 
      ? Math.min(100, (record.processedEntities / record.executionTime) * 10)
      : 50;

    return (timeScore + memoryScore + entityEfficiency) / 3;
  }

  /**
   * システム全体のパフォーマンススコア計算
   */
  private calculateSystemPerformanceScore(metrics: SystemMetrics): number {
    const recentExecutions = this.getRecentExecutions(metrics.systemName, 10);
    if (recentExecutions.length === 0) return 100;

    const scores = recentExecutions.map(record => this.calculatePerformanceScore(record));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * 実行履歴のトリミング
   */
  private trimExecutionHistory(): void {
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * 実行トークン生成
   */
  private generateExecutionToken(): ExecutionToken {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 現在のメモリ使用量取得
   */
  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}