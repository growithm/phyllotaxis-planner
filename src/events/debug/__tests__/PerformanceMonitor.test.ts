import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { EventPerformanceMonitor } from '@/events/debug';
import { IdeaEvents } from '@/events/types';

describe('EventPerformanceMonitor', () => {
  let eventBus: EventBus;
  let performanceMonitor: EventPerformanceMonitor;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    performanceMonitor = new EventPerformanceMonitor(eventBus, {
      slowEventThreshold: 10, // 10ms
      frequentEventThreshold: 5, // 5回/秒
      maxWarnings: 50
    });
  });

  afterEach(() => {
    performanceMonitor.destroy();
    eventBus.clear();
  });

  describe('基本的なメトリクス収集', () => {
    it('イベントの実行時間が記録されること', () => {
      const handler = vi.fn(() => {
        // 処理時間をシミュレート
        const start = performance.now();
        while (performance.now() - start < 5) {
          // 5ms待機
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });

      const metrics = performanceMonitor.getEventMetrics(IdeaEvents.IDEA_ADDED);
      expect(metrics).toBeDefined();
      expect(metrics!.count).toBe(1);
      expect(metrics!.totalDuration).toBeGreaterThan(0);
      expect(metrics!.avgDuration).toBeGreaterThan(0);
      expect(metrics!.minDuration).toBeGreaterThan(0);
      expect(metrics!.maxDuration).toBeGreaterThan(0);
      expect(metrics!.lastExecutionTime).toBeInstanceOf(Date);
    });

    it('複数のイベント実行でメトリクスが累積されること', () => {
      const handler = vi.fn();
      eventBus.on(IdeaEvents.IDEA_ADDED, handler);

      // 3回実行
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test1', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2', text: 'test2', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '3', text: 'test3', timestamp: new Date() });

      const metrics = performanceMonitor.getEventMetrics(IdeaEvents.IDEA_ADDED);
      expect(metrics!.count).toBe(3);
      expect(metrics!.avgDuration).toBe(metrics!.totalDuration / 3);
    });

    it('異なるイベントのメトリクスが別々に記録されること', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(IdeaEvents.IDEA_ADDED, handler1);
      eventBus.on(IdeaEvents.IDEA_REMOVED, handler2);

      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '2', timestamp: new Date() });

      const addedMetrics = performanceMonitor.getEventMetrics(IdeaEvents.IDEA_ADDED);
      const removedMetrics = performanceMonitor.getEventMetrics(IdeaEvents.IDEA_REMOVED);

      expect(addedMetrics!.count).toBe(1);
      expect(removedMetrics!.count).toBe(1);
    });
  });

  describe('パフォーマンス警告', () => {
    it('遅いイベントで警告が生成されること', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const slowHandler = vi.fn(() => {
        // 閾値を超える処理時間をシミュレート
        const start = performance.now();
        while (performance.now() - start < 15) {
          // 15ms待機（閾値10msを超える）
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, slowHandler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });

      const warnings = performanceMonitor.getWarnings('slow_event');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('slow_event');
      expect(warnings[0].event).toBe(IdeaEvents.IDEA_ADDED);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('頻繁なイベントで警告が生成されること', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const handler = vi.fn();
      eventBus.on(IdeaEvents.IDEA_ADDED, handler);

      // 閾値を超える回数のイベントを発行
      for (let i = 0; i < 10; i++) {
        eventBus.emit(IdeaEvents.IDEA_ADDED, { id: i.toString(), text: 'test', timestamp: new Date() });
      }

      const warnings = performanceMonitor.getWarnings('frequent_event');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('frequent_event');

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });

    it('最大警告数を超えた場合、古い警告が削除されること', () => {
      const smallMonitor = new EventPerformanceMonitor(eventBus, {
        slowEventThreshold: 1, // 1ms（すぐに警告が出る）
        maxWarnings: 2
      });

      const slowHandler = vi.fn(() => {
        const start = performance.now();
        while (performance.now() - start < 5) {
          // 5ms待機
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, slowHandler);

      // 3回実行（3つの警告が生成される）
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test1', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2', text: 'test2', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '3', text: 'test3', timestamp: new Date() });

      const warnings = smallMonitor.getWarnings();
      expect(warnings).toHaveLength(2); // 最大2つまで

      smallMonitor.destroy();
    });
  });

  describe('メトリクス分析', () => {
    beforeEach(() => {
      const fastHandler = vi.fn();
      const slowHandler = vi.fn(() => {
        const start = performance.now();
        while (performance.now() - start < 15) {
          // 15ms待機
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, fastHandler);
      eventBus.on(IdeaEvents.IDEA_REMOVED, slowHandler);

      // テストデータを生成
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'fast', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '2', timestamp: new Date() });
    });

    it('遅いイベントを取得できること', () => {
      const slowEvents = performanceMonitor.getSlowEvents();
      
      expect(slowEvents.length).toBeGreaterThan(0);
      expect(slowEvents[0].event).toBe(IdeaEvents.IDEA_REMOVED);
      expect(slowEvents[0].metrics.avgDuration).toBeGreaterThan(10);
    });

    it('カスタム閾値で遅いイベントを取得できること', () => {
      const slowEvents = performanceMonitor.getSlowEvents(20); // 20ms閾値
      
      // 15msのイベントは20ms閾値では遅いイベントに含まれない可能性
      expect(slowEvents.length).toBeLessThanOrEqual(1);
    });

    it('頻繁なイベントを取得できること', () => {
      // 複数回実行してカウントを増やす
      for (let i = 0; i < 10; i++) {
        eventBus.emit(IdeaEvents.IDEA_ADDED, { id: i.toString(), text: 'test', timestamp: new Date() });
      }

      const frequentEvents = performanceMonitor.getFrequentEvents(5);
      
      expect(frequentEvents.length).toBeGreaterThan(0);
      expect(frequentEvents[0].event).toBe(IdeaEvents.IDEA_ADDED);
      expect(frequentEvents[0].metrics.count).toBeGreaterThan(5);
    });
  });

  describe('パフォーマンスサマリー', () => {
    it('パフォーマンスサマリーを取得できること', () => {
      const handler = vi.fn();
      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.on(IdeaEvents.IDEA_REMOVED, handler);

      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test1', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2', text: 'test2', timestamp: new Date() });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '3', timestamp: new Date() });

      const summary = performanceMonitor.getPerformanceSummary();
      
      expect(summary.totalEvents).toBe(3);
      expect(summary.uniqueEvents).toBe(2);
      expect(summary.avgExecutionTime).toBeGreaterThanOrEqual(0);
      expect(summary.totalWarnings).toBeGreaterThanOrEqual(0);
      expect(summary.slowEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe('設定管理', () => {
    it('設定を更新できること', () => {
      performanceMonitor.updateSettings({
        slowEventThreshold: 5,
        frequentEventThreshold: 3,
        maxWarnings: 10
      });

      const slowHandler = vi.fn(() => {
        const start = performance.now();
        while (performance.now() - start < 8) {
          // 8ms待機（新しい閾値5msを超える）
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, slowHandler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });

      const warnings = performanceMonitor.getWarnings('slow_event');
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('maxWarningsを小さくした場合、既存の警告が調整されること', () => {
      // 複数の警告を生成
      const slowHandler = vi.fn(() => {
        const start = performance.now();
        while (performance.now() - start < 15) {
          // 15ms待機
        }
      });

      eventBus.on(IdeaEvents.IDEA_ADDED, slowHandler);

      for (let i = 0; i < 5; i++) {
        eventBus.emit(IdeaEvents.IDEA_ADDED, { id: i.toString(), text: 'test', timestamp: new Date() });
      }

      const initialWarnings = performanceMonitor.getWarnings();
      expect(initialWarnings.length).toBeGreaterThan(2);

      // maxWarningsを2に変更
      performanceMonitor.updateSettings({ maxWarnings: 2 });

      const updatedWarnings = performanceMonitor.getWarnings();
      expect(updatedWarnings).toHaveLength(2);
    });
  });

  describe('メトリクスリセット', () => {
    it('resetMetrics でメトリクスと警告がクリアされること', () => {
      const handler = vi.fn();
      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });

      expect(performanceMonitor.getMetrics().size).toBe(1);

      performanceMonitor.resetMetrics();

      expect(performanceMonitor.getMetrics().size).toBe(0);
      expect(performanceMonitor.getWarnings()).toHaveLength(0);
    });
  });

  describe('破棄処理', () => {
    it('destroy でモニターが正しく破棄されること', () => {
      const handler = vi.fn();
      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test', timestamp: new Date() });

      expect(performanceMonitor.getMetrics().size).toBe(1);

      performanceMonitor.destroy();

      // 破棄後はメトリクスがクリアされる
      expect(performanceMonitor.getMetrics().size).toBe(0);

      // 破棄後はイベントが監視されない
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2', text: 'test2', timestamp: new Date() });
      expect(performanceMonitor.getMetrics().size).toBe(0);
    });
  });
});