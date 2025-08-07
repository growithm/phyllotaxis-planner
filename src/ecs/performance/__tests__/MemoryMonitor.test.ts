/**
 * MemoryMonitor単体テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryMonitor } from '../MemoryMonitor';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createTextComponent } from '@/ecs/components/TextComponent';

describe('MemoryMonitor', () => {
  let world: World;
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    const eventBus = new EventBusImpl();
    world = new World(eventBus);
    memoryMonitor = new MemoryMonitor(world);
  });

  afterEach(() => {
    memoryMonitor.stopContinuousMonitoring();
    world.clear();
  });

  describe('メモリスナップショット', () => {
    it('スナップショットが正常に取得される', () => {
      const snapshot = memoryMonitor.takeSnapshot();
      
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.totalMemory).toBeGreaterThanOrEqual(0);
      expect(snapshot.heapUsed).toBeGreaterThanOrEqual(0);
      expect(snapshot.heapTotal).toBeGreaterThanOrEqual(0);
      expect(snapshot.entityCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.componentCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.estimatedEntityMemory).toBeGreaterThanOrEqual(0);
      expect(snapshot.estimatedComponentMemory).toBeGreaterThanOrEqual(0);
      expect(snapshot.fragmentationRatio).toBeGreaterThanOrEqual(0);
      expect(snapshot.fragmentationRatio).toBeLessThanOrEqual(1);
    });

    it('エンティティとコンポーネントの数が正しく反映される', () => {
      // エンティティとコンポーネントを作成
      const entityId1 = world.createEntity();
      const entityId2 = world.createEntity();
      world.addComponent(entityId1, createPositionComponent(0, 0));
      world.addComponent(entityId1, createTextComponent('test1', 'idea'));
      world.addComponent(entityId2, createPositionComponent(1, 1));
      
      const snapshot = memoryMonitor.takeSnapshot();
      
      expect(snapshot.entityCount).toBe(2);
      expect(snapshot.componentCount).toBe(3);
      expect(snapshot.memoryPerEntity).toBeGreaterThan(0);
      expect(snapshot.memoryPerComponent).toBeGreaterThan(0);
    });

    it('複数のスナップショットが履歴に保存される', () => {
      memoryMonitor.takeSnapshot();
      memoryMonitor.takeSnapshot();
      memoryMonitor.takeSnapshot();
      
      const trend = memoryMonitor.getMemoryTrend(1000);
      expect(trend.snapshots.length).toBe(3);
    });
  });

  describe('継続的監視', () => {
    it('継続的監視が開始・停止される', async () => {
      expect(memoryMonitor['monitoringInterval']).toBeNull();
      
      memoryMonitor.startContinuousMonitoring(50); // 50ms間隔
      expect(memoryMonitor['monitoringInterval']).not.toBeNull();
      
      // 少し待機してスナップショットが取得されることを確認
      await new Promise(resolve => setTimeout(resolve, 120));
      
      const trend = memoryMonitor.getMemoryTrend(1000);
      expect(trend.snapshots.length).toBeGreaterThan(1);
      
      memoryMonitor.stopContinuousMonitoring();
      expect(memoryMonitor['monitoringInterval']).toBeNull();
    });

    it('監視間隔が変更される', () => {
      memoryMonitor.startContinuousMonitoring(100);
      const firstInterval = memoryMonitor['monitoringInterval'];
      
      memoryMonitor.startContinuousMonitoring(200);
      const secondInterval = memoryMonitor['monitoringInterval'];
      
      expect(firstInterval).not.toBe(secondInterval);
      expect(secondInterval).not.toBeNull();
    });
  });

  describe('メモリ推移分析', () => {
    it('メモリ推移が正しく分析される', () => {
      // 複数のスナップショットを取得
      for (let i = 0; i < 5; i++) {
        memoryMonitor.takeSnapshot();
      }
      
      const trend = memoryMonitor.getMemoryTrend(1000);
      
      expect(trend.trend).toMatch(/^(increasing|decreasing|stable)$/);
      expect(typeof trend.changeRate).toBe('number');
      expect(trend.peakMemory).toBeGreaterThanOrEqual(0);
      expect(trend.averageMemory).toBeGreaterThanOrEqual(0);
      expect(trend.snapshots.length).toBe(5);
    });

    it('データが不足している場合の推移分析', () => {
      const trend = memoryMonitor.getMemoryTrend(1000);
      
      expect(trend.trend).toBe('stable');
      expect(trend.changeRate).toBe(0);
      expect(trend.peakMemory).toBe(0);
      expect(trend.averageMemory).toBe(0);
      expect(trend.snapshots.length).toBe(0);
    });

    it('指定期間内のスナップショットのみが対象となる', () => {
      // 古いスナップショット
      memoryMonitor.takeSnapshot();
      
      // 少し待機
      const startTime = Date.now();
      while (Date.now() - startTime < 10) {
        // 10ms待機
      }
      
      // 新しいスナップショット
      memoryMonitor.takeSnapshot();
      memoryMonitor.takeSnapshot();
      
      const shortTrend = memoryMonitor.getMemoryTrend(5); // 5ms以内
      expect(shortTrend.snapshots.length).toBeLessThan(3);
      
      const longTrend = memoryMonitor.getMemoryTrend(1000); // 1秒以内
      expect(longTrend.snapshots.length).toBe(3);
    });
  });

  describe('メモリリーク検出', () => {
    it('メモリリーク検出が実行される', () => {
      // 複数のスナップショットを取得
      for (let i = 0; i < 10; i++) {
        memoryMonitor.takeSnapshot();
      }
      
      const leakReport = memoryMonitor.detectMemoryLeaks();
      
      expect(typeof leakReport.isLeaking).toBe('boolean');
      expect(leakReport.confidence).toBeGreaterThanOrEqual(0);
      expect(leakReport.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(leakReport.suspiciousPatterns)).toBe(true);
      expect(Array.isArray(leakReport.recommendation)).toBe(true);
      expect(leakReport.trend).toBeDefined();
    });

    it('メモリ増加パターンが検出される', () => {
      // メモリ使用量をモック（増加パターン）
      const originalGetTotalMemoryUsage = memoryMonitor['getTotalMemoryUsage'];
      let mockMemory = 1024 * 1024; // 1MB
      
      memoryMonitor['getTotalMemoryUsage'] = vi.fn(() => {
        const current = mockMemory;
        mockMemory += 5120; // 5KB増加（より大きな増加量）
        return current;
      });
      
      // 複数のスナップショットを取得（時間間隔を作る）
      for (let i = 0; i < 30; i++) {
        memoryMonitor.takeSnapshot();
        // 少し時間を空ける
        const startTime = Date.now();
        while (Date.now() - startTime < 1) {
          // 1ms待機
        }
      }
      
      const leakReport = memoryMonitor.detectMemoryLeaks();
      
      expect(leakReport.trend.trend).toBe('increasing');
      expect(leakReport.suspiciousPatterns).toContain('Continuous memory increase detected');
      
      // モックを復元
      memoryMonitor['getTotalMemoryUsage'] = originalGetTotalMemoryUsage;
    });

    it('フラグメンテーション検出が動作する', () => {
      // フラグメンテーション率をモック
      const originalCalculateFragmentationRatio = memoryMonitor['calculateFragmentationRatio'];
      memoryMonitor['calculateFragmentationRatio'] = vi.fn(() => 0.4); // 40%
      
      memoryMonitor.takeSnapshot();
      
      const leakReport = memoryMonitor.detectMemoryLeaks();
      expect(leakReport.suspiciousPatterns).toContain('High memory fragmentation detected');
      
      // モックを復元
      memoryMonitor['calculateFragmentationRatio'] = originalCalculateFragmentationRatio;
    });
  });

  describe('最適化提案', () => {
    it('最適化提案が生成される', () => {
      memoryMonitor.takeSnapshot();
      const suggestions = memoryMonitor.getOptimizationSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion.type).toMatch(/^(entity-optimization|component-optimization|fragmentation-reduction)$/);
        expect(suggestion.priority).toMatch(/^(high|medium|low)$/);
        expect(typeof suggestion.description).toBe('string');
        expect(typeof suggestion.recommendation).toBe('string');
        expect(suggestion.estimatedSaving).toBeGreaterThanOrEqual(0);
      });
    });

    it('高メモリ使用量エンティティの提案が生成される', () => {
      // エンティティあたりのメモリ使用量をモック
      const originalEstimateEntityMemory = memoryMonitor['estimateEntityMemory'];
      memoryMonitor['estimateEntityMemory'] = vi.fn(() => 2048); // 2KB per entity
      
      // エンティティを作成
      world.createEntity();
      memoryMonitor.takeSnapshot();
      
      const suggestions = memoryMonitor.getOptimizationSuggestions();
      const entityOptimization = suggestions.find(s => s.type === 'entity-optimization');
      
      expect(entityOptimization).toBeDefined();
      expect(entityOptimization?.priority).toBe('high');
      
      // モックを復元
      memoryMonitor['estimateEntityMemory'] = originalEstimateEntityMemory;
    });

    it('提案が優先度順にソートされる', () => {
      // 複数の問題をモック
      const originalEstimateEntityMemory = memoryMonitor['estimateEntityMemory'];
      const originalEstimateComponentMemory = memoryMonitor['estimateComponentMemory'];
      const originalCalculateFragmentationRatio = memoryMonitor['calculateFragmentationRatio'];
      
      memoryMonitor['estimateEntityMemory'] = vi.fn(() => 2048); // high priority (>1024)
      memoryMonitor['estimateComponentMemory'] = vi.fn(() => 1024); // medium priority (>512)
      memoryMonitor['calculateFragmentationRatio'] = vi.fn(() => 0.3); // medium priority (>0.25)
      
      // エンティティとコンポーネントを作成して条件を満たす
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      memoryMonitor.takeSnapshot();
      
      const suggestions = memoryMonitor.getOptimizationSuggestions();
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // 高優先度の提案があることを確認（entity-optimizationがhigh priority）
      const highPriorityExists = suggestions.some(s => s.priority === 'high');
      expect(highPriorityExists).toBe(true);
      
      // 優先度順にソートされていることを確認
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      for (let i = 1; i < suggestions.length; i++) {
        expect(priorityOrder[suggestions[i-1].priority]).toBeGreaterThanOrEqual(priorityOrder[suggestions[i].priority]);
      }
      
      // モックを復元
      memoryMonitor['estimateEntityMemory'] = originalEstimateEntityMemory;
      memoryMonitor['estimateComponentMemory'] = originalEstimateComponentMemory;
      memoryMonitor['calculateFragmentationRatio'] = originalCalculateFragmentationRatio;
    });
  });

  describe('アラート機能', () => {
    it('メモリ使用量アラートが生成される', () => {
      // 高メモリ使用量をモック
      const originalGetTotalMemoryUsage = memoryMonitor['getTotalMemoryUsage'];
      memoryMonitor['getTotalMemoryUsage'] = vi.fn(() => 200 * 1024 * 1024); // 200MB
      
      memoryMonitor.takeSnapshot();
      
      const alerts = memoryMonitor.getAlerts('warning');
      expect(alerts.length).toBeGreaterThan(0);
      
      const memoryAlert = alerts.find(alert => alert.type === 'high-memory-usage');
      expect(memoryAlert).toBeDefined();
      expect(memoryAlert?.severity).toBe('warning');
      
      // モックを復元
      memoryMonitor['getTotalMemoryUsage'] = originalGetTotalMemoryUsage;
    });

    it('フラグメンテーションアラートが生成される', () => {
      // 高フラグメンテーション率をモック
      const originalCalculateFragmentationRatio = memoryMonitor['calculateFragmentationRatio'];
      memoryMonitor['calculateFragmentationRatio'] = vi.fn(() => 0.4); // 40%
      
      memoryMonitor.takeSnapshot();
      
      const alerts = memoryMonitor.getAlerts('info');
      const fragmentationAlert = alerts.find(alert => alert.type === 'high-fragmentation');
      
      expect(fragmentationAlert).toBeDefined();
      expect(fragmentationAlert?.severity).toBe('info');
      
      // モックを復元
      memoryMonitor['calculateFragmentationRatio'] = originalCalculateFragmentationRatio;
    });

    it('重要度別アラート取得が動作する', () => {
      // 複数のアラートを生成
      const originalGetTotalMemoryUsage = memoryMonitor['getTotalMemoryUsage'];
      const originalCalculateFragmentationRatio = memoryMonitor['calculateFragmentationRatio'];
      
      memoryMonitor['getTotalMemoryUsage'] = vi.fn(() => 200 * 1024 * 1024); // warning
      memoryMonitor['calculateFragmentationRatio'] = vi.fn(() => 0.4); // info
      
      memoryMonitor.takeSnapshot();
      
      const warningAlerts = memoryMonitor.getAlerts('warning');
      const infoAlerts = memoryMonitor.getAlerts('info');
      const allAlerts = memoryMonitor.getAlerts();
      
      expect(warningAlerts.length).toBeGreaterThan(0);
      expect(infoAlerts.length).toBeGreaterThan(0);
      expect(allAlerts.length).toBe(warningAlerts.length + infoAlerts.length);
      
      // モックを復元
      memoryMonitor['getTotalMemoryUsage'] = originalGetTotalMemoryUsage;
      memoryMonitor['calculateFragmentationRatio'] = originalCalculateFragmentationRatio;
    });
  });

  describe('統計リセット', () => {
    it('統計リセットが正常に動作する', () => {
      // データを生成
      memoryMonitor.takeSnapshot();
      memoryMonitor.takeSnapshot();
      
      // アラートを生成
      const originalGetTotalMemoryUsage = memoryMonitor['getTotalMemoryUsage'];
      memoryMonitor['getTotalMemoryUsage'] = vi.fn(() => 200 * 1024 * 1024);
      memoryMonitor.takeSnapshot();
      
      // リセット前の確認
      expect(memoryMonitor.getMemoryTrend(1000).snapshots.length).toBe(3);
      expect(memoryMonitor.getAlerts().length).toBeGreaterThan(0);
      
      // リセット実行
      memoryMonitor.resetStats();
      
      // リセット後の確認
      expect(memoryMonitor.getMemoryTrend(1000).snapshots.length).toBe(0);
      expect(memoryMonitor.getAlerts().length).toBe(0);
      
      // モックを復元
      memoryMonitor['getTotalMemoryUsage'] = originalGetTotalMemoryUsage;
    });
  });

  describe('相関計算', () => {
    it('エンティティ数とメモリ使用量の相関が計算される', () => {
      // 相関の高いデータを生成
      for (let i = 0; i < 15; i++) {
        // エンティティ数に比例してメモリ使用量が増加するようにモック
        const originalGetTotalMemoryUsage = memoryMonitor['getTotalMemoryUsage'];
        memoryMonitor['getTotalMemoryUsage'] = vi.fn(() => 1024 * 1024 + i * 1024); // 基本1MB + i KB
        
        if (i > 0) {
          world.createEntity();
        }
        memoryMonitor.takeSnapshot();
        
        memoryMonitor['getTotalMemoryUsage'] = originalGetTotalMemoryUsage;
      }
      
      const correlation = memoryMonitor['calculateEntityMemoryCorrelation']();
      expect(correlation).toBeGreaterThan(0.5); // 正の相関
    });
  });

  describe('メモリ使用量推定', () => {
    it('エンティティメモリが正しく推定される', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test', 'idea'));
      
      const estimatedEntityMemory = memoryMonitor['estimateEntityMemory']();
      const estimatedComponentMemory = memoryMonitor['estimateComponentMemory']();
      
      expect(estimatedEntityMemory).toBeGreaterThan(0);
      expect(estimatedComponentMemory).toBeGreaterThan(0);
    });
  });
});