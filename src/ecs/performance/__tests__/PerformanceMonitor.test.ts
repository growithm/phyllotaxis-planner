/**
 * PerformanceMonitor統合テスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createTextComponent } from '@/ecs/components/TextComponent';

describe('PerformanceMonitor統合テスト', () => {
  let world: World;
  let eventBus: EventBusImpl;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    performanceMonitor = new PerformanceMonitor(world, {
      enabled: true,
      metricsOptions: {
        maxHistorySize: 100,
        aggregationInterval: 100,
        enableDetailedMetrics: true
      },
      analysisOptions: {
        enableLeakDetection: true,
        enableBottleneckDetection: true
      }
    });
  });

  afterEach(() => {
    performanceMonitor.disable();
    world.clear();
  });

  describe('基本機能テスト', () => {
    it('PerformanceMonitorが正常に初期化される', () => {
      expect(performanceMonitor.isMonitoringEnabled()).toBe(true);
      expect(performanceMonitor.getSystemMonitor()).toBeDefined();
      expect(performanceMonitor.getMemoryMonitor()).toBeDefined();
      expect(performanceMonitor.getEntityMonitor()).toBeDefined();
      expect(performanceMonitor.getReportGenerator()).toBeDefined();
    });

    it('監視の有効化・無効化が正常に動作する', () => {
      expect(performanceMonitor.isMonitoringEnabled()).toBe(true);
      
      performanceMonitor.disable();
      expect(performanceMonitor.isMonitoringEnabled()).toBe(false);
      
      performanceMonitor.enable();
      expect(performanceMonitor.isMonitoringEnabled()).toBe(true);
    });

    it('設定の更新が正常に動作する', () => {
      const newOptions = {
        metricsOptions: {
          maxHistorySize: 200,
          enableDetailedMetrics: false
        }
      };

      performanceMonitor.updateSettings(newOptions);
      const settings = performanceMonitor.getSettings();
      
      expect(settings.metricsOptions.maxHistorySize).toBe(200);
      expect(settings.metricsOptions.enableDetailedMetrics).toBe(false);
    });
  });

  describe('SystemMonitor統合テスト', () => {
    it('システム実行監視が正常に動作する', () => {
      const systemMonitor = performanceMonitor.getSystemMonitor();
      
      // システム実行開始
      const token = systemMonitor.startSystemExecution('TestSystem');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // 少し待機（実行時間をシミュレート）
      const startTime = performance.now();
      while (performance.now() - startTime < 1) {
        // 1ms待機
      }
      
      // システム実行終了
      const result = systemMonitor.endSystemExecution(token, 5);
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.processedEntities).toBe(5);
      expect(result.performanceScore).toBeGreaterThan(0);
      expect(result.performanceScore).toBeLessThanOrEqual(100);
    });

    it('システムメトリクスが正常に収集される', () => {
      const systemMonitor = performanceMonitor.getSystemMonitor();
      
      // 複数回実行
      for (let i = 0; i < 3; i++) {
        const token = systemMonitor.startSystemExecution('TestSystem');
        const result = systemMonitor.endSystemExecution(token, i + 1);
        expect(result).toBeDefined();
      }
      
      const metrics = systemMonitor.getSystemMetrics('TestSystem');
      expect(metrics).toHaveLength(1);
      
      const systemMetrics = metrics[0];
      expect(systemMetrics.systemName).toBe('TestSystem');
      expect(systemMetrics.totalExecutions).toBe(3);
      expect(systemMetrics.averageExecutionTime).toBeGreaterThan(0);
      expect(systemMetrics.totalProcessedEntities).toBe(6); // 1+2+3
    });

    it('遅いシステムの検出が正常に動作する', async () => {
      const systemMonitor = performanceMonitor.getSystemMonitor();
      
      // 遅いシステムをシミュレート
      const token = systemMonitor.startSystemExecution('SlowSystem');
      
      // 10ms待機
      await new Promise(resolve => setTimeout(resolve, 10));
      
      systemMonitor.endSystemExecution(token, 1);
      
      const slowSystems = systemMonitor.getSlowSystems(5.0);
      expect(slowSystems).toHaveLength(1);
      expect(slowSystems[0].systemName).toBe('SlowSystem');
    });
  });

  describe('MemoryMonitor統合テスト', () => {
    it('メモリスナップショットが正常に取得される', () => {
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      
      const snapshot = memoryMonitor.takeSnapshot();
      
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.totalMemory).toBeGreaterThanOrEqual(0);
      expect(snapshot.entityCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.componentCount).toBeGreaterThanOrEqual(0);
      expect(snapshot.fragmentationRatio).toBeGreaterThanOrEqual(0);
      expect(snapshot.fragmentationRatio).toBeLessThanOrEqual(1);
    });

    it('メモリ推移分析が正常に動作する', () => {
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      
      // 複数のスナップショットを取得
      for (let i = 0; i < 5; i++) {
        memoryMonitor.takeSnapshot();
      }
      
      const trend = memoryMonitor.getMemoryTrend(1000);
      
      expect(trend.trend).toMatch(/^(increasing|decreasing|stable)$/);
      expect(trend.changeRate).toBeDefined();
      expect(trend.peakMemory).toBeGreaterThanOrEqual(0);
      expect(trend.averageMemory).toBeGreaterThanOrEqual(0);
      expect(trend.snapshots.length).toBeGreaterThan(0);
    });

    it('メモリリーク検出が正常に動作する', () => {
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      
      // 複数のスナップショットを取得
      for (let i = 0; i < 10; i++) {
        memoryMonitor.takeSnapshot();
      }
      
      const leakReport = memoryMonitor.detectMemoryLeaks();
      
      expect(leakReport.isLeaking).toBeDefined();
      expect(leakReport.confidence).toBeGreaterThanOrEqual(0);
      expect(leakReport.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(leakReport.suspiciousPatterns)).toBe(true);
      expect(Array.isArray(leakReport.recommendation)).toBe(true);
      expect(leakReport.trend).toBeDefined();
    });

    it('最適化提案が正常に生成される', () => {
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      
      memoryMonitor.takeSnapshot();
      const suggestions = memoryMonitor.getOptimizationSuggestions();
      
      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion.type).toMatch(/^(entity-optimization|component-optimization|fragmentation-reduction)$/);
        expect(suggestion.priority).toMatch(/^(high|medium|low)$/);
        expect(suggestion.description).toBeDefined();
        expect(suggestion.recommendation).toBeDefined();
        expect(suggestion.estimatedSaving).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('EntityMonitor統合テスト', () => {
    it('エンティティライフサイクル監視が正常に動作する', () => {
      const entityMonitor = performanceMonitor.getEntityMonitor();
      
      // エンティティを作成
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      
      // エンティティを削除
      world.destroyEntity(entityId);
      entityMonitor.recordEntityDestruction(entityId);
      
      const stats = entityMonitor.getEntityStats();
      
      expect(stats.totalCreated).toBe(1);
      expect(stats.totalDestroyed).toBe(1);
      expect(stats.currentActive).toBe(0);
      expect(stats.creationRate).toBeGreaterThanOrEqual(0);
      expect(stats.destructionRate).toBeGreaterThanOrEqual(0);
    });

    it('エンティティ作成パターン分析が正常に動作する', () => {
      const entityMonitor = performanceMonitor.getEntityMonitor();
      
      // 複数のエンティティを作成
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
      }
      
      const analysis = entityMonitor.analyzeCreationPatterns();
      
      expect(analysis.pattern).toMatch(/^(steady|bursty|irregular|insufficient-data)$/);
      expect(analysis.burstDetected).toBeDefined();
      expect(analysis.averageInterval).toBeGreaterThanOrEqual(0);
      expect(analysis.peakCreationRate).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('メモリ効率分析が正常に動作する', () => {
      const entityMonitor = performanceMonitor.getEntityMonitor();
      
      // エンティティとコンポーネントを作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test', 'idea'));
      
      const analysis = entityMonitor.analyzeMemoryEfficiency();
      
      expect(analysis.totalMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(analysis.averageMemoryPerEntity).toBeGreaterThanOrEqual(0);
      expect(typeof analysis.componentMemoryBreakdown).toBe('object');
      expect(analysis.efficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('パフォーマンス影響分析が正常に動作する', () => {
      const entityMonitor = performanceMonitor.getEntityMonitor();
      
      // 複数のエンティティとコンポーネントを作成
      for (let i = 0; i < 3; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createPositionComponent(i, i));
        world.addComponent(entityId, createTextComponent(`entity-${i}`, 'idea'));
      }
      
      const analysis = entityMonitor.analyzePerformanceImpact();
      
      expect(analysis.entityCount).toBe(3);
      expect(analysis.componentCount).toBe(6); // 3 entities * 2 components
      expect(analysis.entityDensity).toBe(2); // 6 components / 3 entities
      expect(analysis.predictedQueryTime).toBeGreaterThan(0);
      expect(analysis.predictedUpdateTime).toBeGreaterThan(0);
      expect(Array.isArray(analysis.bottlenecks)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });
  });

  describe('ReportGenerator統合テスト', () => {
    it('総合レポートが正常に生成される', () => {
      // システム実行をシミュレート
      const systemMonitor = performanceMonitor.getSystemMonitor();
      const token = systemMonitor.startSystemExecution('TestSystem');
      systemMonitor.endSystemExecution(token, 5);
      
      // メモリスナップショットを取得
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      memoryMonitor.takeSnapshot();
      
      // エンティティを作成
      const entityMonitor = performanceMonitor.getEntityMonitor();
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      
      const report = performanceMonitor.generateReport();
      
      expect(report.timestamp).toBeInstanceOf(Date);
      expect(typeof report.summary).toBe('string');
      expect(report.systemPerformance).toBeDefined();
      expect(report.memoryAnalysis).toBeDefined();
      expect(report.entityAnalysis).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
    });

    it('HTMLレポートが正常に生成される', () => {
      const reportGenerator = performanceMonitor.getReportGenerator();
      const htmlReport = reportGenerator.generateHTMLReport();
      
      expect(typeof htmlReport).toBe('string');
      expect(htmlReport).toContain('<!DOCTYPE html>');
      expect(htmlReport).toContain('Performance Report');
      expect(htmlReport).toContain('System Performance');
      expect(htmlReport).toContain('Memory Analysis');
      expect(htmlReport).toContain('Entity Analysis');
    });

    it('JSONレポートが正常に生成される', () => {
      const reportGenerator = performanceMonitor.getReportGenerator();
      const jsonReport = reportGenerator.generateJSONReport();
      
      expect(typeof jsonReport).toBe('string');
      
      const parsedReport = JSON.parse(jsonReport);
      expect(parsedReport.timestamp).toBeDefined();
      expect(parsedReport.summary).toBeDefined();
      expect(parsedReport.systemPerformance).toBeDefined();
      expect(parsedReport.memoryAnalysis).toBeDefined();
      expect(parsedReport.entityAnalysis).toBeDefined();
    });

    it('CSVレポートが正常に生成される', () => {
      const reportGenerator = performanceMonitor.getReportGenerator();
      const csvReport = reportGenerator.generateCSVReport();
      
      expect(typeof csvReport).toBe('string');
      expect(csvReport).toContain('Metric,Value,Unit,Timestamp');
      expect(csvReport).toContain('Total Systems');
      expect(csvReport).toContain('Memory Trend');
      expect(csvReport).toContain('Active Entities');
    });
  });

  describe('統計リセット機能テスト', () => {
    it('全統計のリセットが正常に動作する', () => {
      // データを生成
      const systemMonitor = performanceMonitor.getSystemMonitor();
      const token = systemMonitor.startSystemExecution('TestSystem');
      systemMonitor.endSystemExecution(token, 1);
      
      const memoryMonitor = performanceMonitor.getMemoryMonitor();
      memoryMonitor.takeSnapshot();
      
      const entityMonitor = performanceMonitor.getEntityMonitor();
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      
      // リセット前の確認
      expect(systemMonitor.getSystemMetrics()).toHaveLength(1);
      expect(entityMonitor.getEntityStats().totalCreated).toBe(1);
      
      // リセット実行
      performanceMonitor.resetAllStats();
      
      // リセット後の確認
      expect(systemMonitor.getSystemMetrics()).toHaveLength(0);
      expect(entityMonitor.getEntityStats().totalCreated).toBe(0);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('無効なトークンでシステム実行終了を試行した場合エラーが発生する', () => {
      const systemMonitor = performanceMonitor.getSystemMonitor();
      
      expect(() => {
        systemMonitor.endSystemExecution('invalid-token', 0);
      }).toThrow('Invalid execution token');
    });

    it('監視が無効な状態でレポート生成を試行した場合エラーが発生する', () => {
      performanceMonitor.disable();
      
      expect(() => {
        performanceMonitor.generateReport();
      }).toThrow('PerformanceMonitor is disabled');
    });
  });

  describe('パフォーマンス要件テスト', () => {
    it('50個のエンティティでクエリが1ms以内で完了する', () => {
      // 50個のエンティティを作成
      for (let i = 0; i < 50; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createPositionComponent(i, i));
        world.addComponent(entityId, createTextComponent(`entity-${i}`, 'idea'));
      }
      
      const startTime = performance.now();
      
      // クエリ実行
      const entities = world.getEntitiesWithComponents(ComponentTypes.POSITION, ComponentTypes.TEXT);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(entities).toHaveLength(50);
      expect(executionTime).toBeLessThan(1.0); // 1ms以内
    });

    it('50個のエンティティで更新が5ms以内で完了する', () => {
      const entityMonitor = performanceMonitor.getEntityMonitor();
      
      const startTime = performance.now();
      
      // 50個のエンティティを作成・更新
      for (let i = 0; i < 50; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
        world.addComponent(entityId, createPositionComponent(i, i));
        world.addComponent(entityId, createTextComponent(`entity-${i}`, 'idea'));
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5.0); // 5ms以内
    });
  });
});