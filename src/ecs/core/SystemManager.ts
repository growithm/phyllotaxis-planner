/**
 * システムの管理と実行を行うマネージャー
 */

import { ISystem, SystemStats, IWorld } from '@/ecs/core/System';
import { EntityId } from '@/ecs/core/Entity';
import { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';

/**
 * システムの管理と実行を行うマネージャー
 */
export class SystemManager {
  private systems: ISystem[] = [];
  private isRunning: boolean = false;
  private performanceStats: Map<string, number[]> = new Map();
  private eventBus?: EventBus;

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * システムを追加
   */
  addSystem(system: ISystem): void {
    // 既存のシステムと同じ名前がないかチェック
    if (this.systems.some(s => s.name === system.name)) {
      throw new Error(`System with name '${system.name}' already exists`);
    }

    this.systems.push(system);
    // 優先度順にソート（数値が小さいほど高優先度）
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  /**
   * システムを削除
   */
  removeSystem(systemName: string): boolean {
    const index = this.systems.findIndex(s => s.name === systemName);
    if (index === -1) {
      return false;
    }

    this.systems.splice(index, 1);
    this.performanceStats.delete(systemName);
    return true;
  }

  /**
   * 指定された名前のシステムを取得
   */
  getSystem(systemName: string): ISystem | undefined {
    return this.systems.find(s => s.name === systemName);
  }

  /**
   * 全システムを取得
   */
  getAllSystems(): ISystem[] {
    return [...this.systems];
  }

  /**
   * システムマネージャーを開始
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * システムマネージャーを停止
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * 実行中かどうかを確認
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 全システムを実行
   */
  update(entities: EntityId[], world: IWorld, deltaTime: number): void {
    if (!this.isRunning) {
      return;
    }

    for (const system of this.systems) {
      try {
        const startTime = performance.now();
        
        system.update(entities, world, deltaTime);
        
        const endTime = performance.now();
        this.recordSystemPerformance(system.name, endTime - startTime);
      } catch (error) {
        console.error(`Error in system ${system.name}:`, error);
        
        // エラーイベント発火
        if (this.eventBus) {
          this.eventBus.emit(SystemEvents.ERROR_OCCURRED, {
            source: system.name,
            message: error instanceof Error ? error.message : String(error),
            error: error instanceof Error ? error : undefined,
            recoverable: true,
            timestamp: new Date()
          });
        }
        
        // エラーが発生してもシステム実行を継続
      }
    }
  }

  /**
   * システムのパフォーマンス統計を記録
   */
  private recordSystemPerformance(systemName: string, duration: number): void {
    if (!this.performanceStats.has(systemName)) {
      this.performanceStats.set(systemName, []);
    }

    const stats = this.performanceStats.get(systemName)!;
    stats.push(duration);

    // 最新100回の実行時間のみ保持
    if (stats.length > 100) {
      stats.shift();
    }
  }

  /**
   * システム統計を取得
   */
  getSystemStats(world: IWorld): SystemStats[] {
    const allEntities = world.getAllEntities();
    
    return this.systems.map(system => {
      const processableEntities = allEntities.filter(entityId =>
        system.requiredComponents.every(type =>
          world.hasComponent(entityId, type)
        )
      ).length;

      const performanceData = this.performanceStats.get(system.name) || [];
      const lastExecutionTime = performanceData.length > 0 
        ? performanceData[performanceData.length - 1] 
        : undefined;

      return {
        name: system.name,
        priority: system.priority,
        requiredComponents: system.requiredComponents,
        processableEntities,
        lastExecutionTime
      };
    });
  }

  /**
   * システムのパフォーマンス統計を取得
   */
  getPerformanceStats(systemName: string): { avg: number; max: number; min: number; count: number } | null {
    const stats = this.performanceStats.get(systemName);
    if (!stats || stats.length === 0) {
      return null;
    }

    const avg = stats.reduce((sum, time) => sum + time, 0) / stats.length;
    const max = Math.max(...stats);
    const min = Math.min(...stats);

    return { avg, max, min, count: stats.length };
  }

  /**
   * 全システムのパフォーマンス統計をクリア
   */
  clearPerformanceStats(): void {
    this.performanceStats.clear();
  }

  /**
   * システムマネージャーをクリア（テスト用）
   */
  clear(): void {
    this.systems = [];
    this.performanceStats.clear();
    this.isRunning = false;
  }
}