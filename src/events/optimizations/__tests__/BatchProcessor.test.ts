import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { EventBatchProcessor } from '@/events/optimizations';
import { IdeaEvents } from '@/events/types';

describe('EventBatchProcessor', () => {
  let eventBus: EventBus;
  let batchProcessor: EventBatchProcessor;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    batchProcessor = new EventBatchProcessor(eventBus, 10); // 10ms間隔
  });

  afterEach(() => {
    batchProcessor.destroy();
    eventBus.clear();
  });

  describe('基本的なバッチ処理', () => {
    it('イベントをバッチキューに追加できること', () => {
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData1);
      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData2);

      const status = batchProcessor.getBatchStatus();
      expect(status.get(IdeaEvents.IDEA_ADDED)).toBe(2);
    });

    it('バッチ処理でイベントが発火されること', async () => {
      const batchHandler = vi.fn();
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

      eventBus.on(`${IdeaEvents.IDEA_ADDED}:batch`, batchHandler);

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData1);
      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData2);

      // バッチ処理を待つ
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(batchHandler).toHaveBeenCalledWith([testData1, testData2]);
    });

    it('異なるイベントタイプが別々にバッチ処理されること', async () => {
      const ideaBatchHandler = vi.fn();
      const removeBatchHandler = vi.fn();
      
      const ideaData = { id: '1', text: 'test', timestamp: new Date() };
      const removeData = { id: '2', timestamp: new Date() };

      eventBus.on(`${IdeaEvents.IDEA_ADDED}:batch`, ideaBatchHandler);
      eventBus.on(`${IdeaEvents.IDEA_REMOVED}:batch`, removeBatchHandler);

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, ideaData);
      batchProcessor.batchEmit(IdeaEvents.IDEA_REMOVED, removeData);

      // バッチ処理を待つ
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(ideaBatchHandler).toHaveBeenCalledWith([ideaData]);
      expect(removeBatchHandler).toHaveBeenCalledWith([removeData]);
    });
  });

  describe('バッチ制御', () => {
    it('flushBatch で即座にバッチを処理できること', () => {
      const batchHandler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(`${IdeaEvents.IDEA_ADDED}:batch`, batchHandler);
      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData);

      // 即座にフラッシュ
      batchProcessor.flushBatch();

      expect(batchHandler).toHaveBeenCalledWith([testData]);
    });

    it('clearBatch でバッチキューをクリアできること', () => {
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData);
      expect(batchProcessor.getBatchStatus().get(IdeaEvents.IDEA_ADDED)).toBe(1);

      batchProcessor.clearBatch();
      expect(batchProcessor.getBatchStatus().size).toBe(0);
    });

    it('setBatchInterval でバッチ間隔を変更できること', async () => {
      const batchHandler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(`${IdeaEvents.IDEA_ADDED}:batch`, batchHandler);
      
      // バッチ間隔を50msに変更
      batchProcessor.setBatchInterval(50);
      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData);

      // 30ms後はまだ処理されていない
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(batchHandler).not.toHaveBeenCalled();

      // 60ms後は処理されている
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(batchHandler).toHaveBeenCalledWith([testData]);
    });
  });

  describe('バッチ状態の監視', () => {
    it('getBatchStatus で現在のバッチ状態を取得できること', () => {
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };
      const removeData = { id: '3', timestamp: new Date() };

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData1);
      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData2);
      batchProcessor.batchEmit(IdeaEvents.IDEA_REMOVED, removeData);

      const status = batchProcessor.getBatchStatus();
      expect(status.get(IdeaEvents.IDEA_ADDED)).toBe(2);
      expect(status.get(IdeaEvents.IDEA_REMOVED)).toBe(1);
      expect(status.size).toBe(2);
    });

    it('バッチ処理後にキューがクリアされること', async () => {
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData);
      expect(batchProcessor.getBatchStatus().get(IdeaEvents.IDEA_ADDED)).toBe(1);

      // バッチ処理を待つ
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(batchProcessor.getBatchStatus().size).toBe(0);
    });
  });

  describe('破棄処理', () => {
    it('destroy でバッチプロセッサーが正しく破棄されること', () => {
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      batchProcessor.batchEmit(IdeaEvents.IDEA_ADDED, testData);
      expect(batchProcessor.getBatchStatus().size).toBe(1);

      batchProcessor.destroy();
      expect(batchProcessor.getBatchStatus().size).toBe(0);
    });
  });
});