/**
 * SystemMonitor単体テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemMonitor } from '../SystemMonitor';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';

describe('SystemMonitor', () => {
  let world: World;
  let systemMonitor: SystemMonitor;

  beforeEach(() => {
    const eventBus = new EventBusImpl();
    world = new World(eventBus);
    systemMonitor = new SystemMonitor(world);
  });

  describe('システム実行監視', () => {
    it('システム実行開始でトークンが生成される', () => {
      const token = systemMonitor.startSystemExecution('TestSystem');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^exec_\d+_[a-z0-9]+$/);
    });

    it('システム実行終了で正しい結果が返される', () => {
      const token = systemMonitor.startSystemExecution('TestSystem');
      
      // 少し待機
      const startTime = performance.now();
      while (performance.now() - startTime < 1) {
        // 1ms待機
      }
      
      const result = systemMonitor.endSystemExecution(token, 10);
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.processedEntities).toBe(10);
      expect(result.performanceScore).toBeGreaterThan(0);
      expect(result.performanceScore).toBeLessThanOrEqual(100);
      expect(typeof result.memoryDelta).toBe('number');
    });

    it('無効なトークンでエラーが発生する', () => {
      expect(() => {
        systemMonitor.endSystemExecution('invalid-token', 0);
      }).toThrow('Invalid execution token: invalid-token');
    });

    it('複数の同時実行が正常に処理される', () => {
      const token1 = systemMonitor.startSystemExecution('System1');
      const token2 = systemMonitor.startSystemExecution('System2');
      
      expect(token1).not.toBe(token2);
      
      const result1 = systemMonitor.endSystemExecution(token1, 5);
      const result2 = systemMonitor.endSystemExecution(token2, 3);
      
      expect(result1.processedEntities).toBe(5);
      expect(result2.processedEntities).toBe(3);
    });
  });

  describe('システムメトリクス', () => {
    it('システムメトリクスが正しく更新される', () => {
      // 複数回実行
      for (let i = 0; i < 3; i++) {
        const token = systemMonitor.startSystemExecution('TestSystem');
        systemMonitor.endSystemExecution(token, i + 1);
      }
      
      const metrics = systemMonitor.getSystemMetrics('TestSystem');
      expect(metrics).toHaveLength(1);
      
      const systemMetrics = metrics[0];
      expect(systemMetrics.systemName).toBe('TestSystem');
      expect(systemMetrics.totalExecutions).toBe(3);
      expect(systemMetrics.totalProcessedEntities).toBe(6); // 1+2+3
      expect(systemMetrics.averageExecutionTime).toBeGreaterThan(0);
      expect(systemMetrics.averageProcessedEntities).toBe(2); // 6/3
      expect(systemMetrics.minExecutionTime).toBeGreaterThan(0);
      expect(systemMetrics.maxExecutionTime).toBeGreaterThanOrEqual(systemMetrics.minExecutionTime);
      expect(systemMetrics.performanceScore).toBeGreaterThan(0);
      expect(systemMetrics.performanceScore).toBeLessThanOrEqual(100);
    });

    it('複数システムのメトリクスが独立して管理される', () => {
      const token1 = systemMonitor.startSystemExecution('System1');
      systemMonitor.endSystemExecution(token1, 5);
      
      const token2 = systemMonitor.startSystemExecution('System2');
      systemMonitor.endSystemExecution(token2, 3);
      
      const allMetrics = systemMonitor.getSystemMetrics();
      expect(allMetrics).toHaveLength(2);
      
      const system1Metrics = systemMonitor.getSystemMetrics('System1');
      const system2Metrics = systemMonitor.getSystemMetrics('System2');
      
      expect(system1Metrics[0].totalProcessedEntities).toBe(5);
      expect(system2Metrics[0].totalProcessedEntities).toBe(3);
    });

    it('存在しないシステムのメトリクス取得で空配列が返される', () => {
      const metrics = systemMonitor.getSystemMetrics('NonExistentSystem');
      expect(metrics).toHaveLength(0);
    });
  });

  describe('実行履歴管理', () => {
    it('最近の実行記録が正しく取得される', () => {
      // 複数回実行
      for (let i = 0; i < 5; i++) {
        const token = systemMonitor.startSystemExecution('TestSystem');
        systemMonitor.endSystemExecution(token, i);
      }
      
      const recentExecutions = systemMonitor.getRecentExecutions('TestSystem', 3);
      expect(recentExecutions).toHaveLength(3);
      
      // 最新の実行が最後に来ることを確認
      expect(recentExecutions[2].processedEntities).toBe(4);
      expect(recentExecutions[1].processedEntities).toBe(3);
      expect(recentExecutions[0].processedEntities).toBe(2);
    });

    it('実行履歴が上限を超えた場合に古い記録が削除される', () => {
      const maxHistorySize = 10;
      const systemMonitorWithLimit = new SystemMonitor(world, maxHistorySize);
      
      // 上限を超える数の実行を行う
      for (let i = 0; i < 15; i++) {
        const token = systemMonitorWithLimit.startSystemExecution('TestSystem');
        systemMonitorWithLimit.endSystemExecution(token, i);
      }
      
      const allExecutions = systemMonitorWithLimit.getRecentExecutions('TestSystem', 20);
      expect(allExecutions.length).toBeLessThanOrEqual(maxHistorySize);
    });
  });

  describe('パフォーマンス分析', () => {
    it('遅いシステムが正しく検出される', async () => {
      // 通常のシステム
      const normalToken = systemMonitor.startSystemExecution('NormalSystem');
      systemMonitor.endSystemExecution(normalToken, 1);
      
      // 遅いシステム
      const slowToken = systemMonitor.startSystemExecution('SlowSystem');
      await new Promise(resolve => setTimeout(resolve, 10)); // 10ms待機
      systemMonitor.endSystemExecution(slowToken, 1);
      
      const slowSystems = systemMonitor.getSlowSystems(5.0); // 5ms以上
      expect(slowSystems).toHaveLength(1);
      expect(slowSystems[0].systemName).toBe('SlowSystem');
      expect(slowSystems[0].averageExecutionTime).toBeGreaterThan(5.0);
    });

    it('メモリ使用量の多いシステムが検出される', () => {
      // メモリ使用量をモック
      const originalGetCurrentMemoryUsage = (systemMonitor as any).getCurrentMemoryUsage;
      let memoryUsage = 1024 * 1024; // 1MB
      
      (systemMonitor as any).getCurrentMemoryUsage = vi.fn(() => {
        const current = memoryUsage;
        memoryUsage += 20 * 1024 * 1024; // 20MB増加
        return current;
      });
      
      const token = systemMonitor.startSystemExecution('MemoryIntensiveSystem');
      systemMonitor.endSystemExecution(token, 1);
      
      const memoryIntensiveSystems = systemMonitor.getMemoryIntensiveSystems(10 * 1024 * 1024); // 10MB以上
      expect(memoryIntensiveSystems).toHaveLength(1);
      expect(memoryIntensiveSystems[0].systemName).toBe('MemoryIntensiveSystem');
      
      // モックを復元
      (systemMonitor as any).getCurrentMemoryUsage = originalGetCurrentMemoryUsage;
    });

    it('システムサマリーが正しく計算される', () => {
      // 複数のシステムを実行
      const systems = ['System1', 'System2', 'System3'];
      systems.forEach((systemName, index) => {
        for (let i = 0; i < 2; i++) {
          const token = systemMonitor.startSystemExecution(systemName);
          systemMonitor.endSystemExecution(token, index + 1);
        }
      });
      
      const summary = systemMonitor.getSystemsSummary();
      
      expect(summary.totalSystems).toBe(3);
      expect(summary.totalExecutions).toBe(6); // 3 systems * 2 executions
      expect(summary.averagePerformanceScore).toBeGreaterThan(0);
      expect(summary.averagePerformanceScore).toBeLessThanOrEqual(100);
      expect(summary.totalExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('統計リセット', () => {
    it('統計リセットが正常に動作する', () => {
      // データを生成
      const token = systemMonitor.startSystemExecution('TestSystem');
      systemMonitor.endSystemExecution(token, 5);
      
      // リセット前の確認
      expect(systemMonitor.getSystemMetrics()).toHaveLength(1);
      expect(systemMonitor.getRecentExecutions('TestSystem')).toHaveLength(1);
      
      // リセット実行
      systemMonitor.resetStats();
      
      // リセット後の確認
      expect(systemMonitor.getSystemMetrics()).toHaveLength(0);
      expect(systemMonitor.getRecentExecutions('TestSystem')).toHaveLength(0);
      expect(systemMonitor.getSystemsSummary().totalSystems).toBe(0);
    });
  });

  describe('パフォーマンススコア計算', () => {
    it('パフォーマンススコアが適切に計算される', () => {
      // 高速実行（高スコア期待）
      const fastToken = systemMonitor.startSystemExecution('FastSystem');
      systemMonitor.endSystemExecution(fastToken, 100); // 多くのエンティティを高速処理
      
      const fastMetrics = systemMonitor.getSystemMetrics('FastSystem')[0];
      expect(fastMetrics.performanceScore).toBeGreaterThan(50);
      
      // 低速実行（低スコア期待）
      const slowToken = systemMonitor.startSystemExecution('SlowSystem');
      // 実行時間を長くするため、同期的に待機
      const startTime = performance.now();
      while (performance.now() - startTime < 5) {
        // 5ms待機
      }
      systemMonitor.endSystemExecution(slowToken, 1); // 少ないエンティティを低速処理
      
      const slowMetrics = systemMonitor.getSystemMetrics('SlowSystem')[0];
      expect(slowMetrics.performanceScore).toBeLessThan(fastMetrics.performanceScore);
    });
  });
});