import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import { IdeaEvents } from '@/events/types';
import type { EventBus } from '@/events/core';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBusImpl();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('基本的なイベント発行・購読', () => {
    it('イベントを発行し、リスナーが呼び出されること', () => {
      const handler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(handler).toHaveBeenCalledWith(testData);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('複数のリスナーが登録されている場合、すべて呼び出されること', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(IdeaEvents.IDEA_ADDED, handler1);
      eventBus.on(IdeaEvents.IDEA_ADDED, handler2);
      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(handler1).toHaveBeenCalledWith(testData);
      expect(handler2).toHaveBeenCalledWith(testData);
    });

    it('異なるイベントのリスナーは呼び出されないこと', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(IdeaEvents.IDEA_ADDED, handler1);
      eventBus.on(IdeaEvents.IDEA_REMOVED, handler2);
      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(handler1).toHaveBeenCalledWith(testData);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('リスナーの削除', () => {
    it('アンサブスクライブ関数でリスナーが削除されること', () => {
      const handler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      const unsubscribe = eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      unsubscribe();

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(handler).not.toHaveBeenCalled();
    });

    it('off メソッドでリスナーが削除されること', () => {
      const handler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(IdeaEvents.IDEA_ADDED, handler);
      eventBus.off(IdeaEvents.IDEA_ADDED, handler);

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('一回限りのリスナー', () => {
    it('once で登録されたリスナーは一度だけ呼び出されること', () => {
      const handler = vi.fn();
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

      eventBus.once(IdeaEvents.IDEA_ADDED, handler);

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData1);
      eventBus.emit(IdeaEvents.IDEA_ADDED, testData2);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testData1);
    });
  });

  describe('エラーハンドリング', () => {
    it('リスナー内でエラーが発生しても他のリスナーは実行されること', () => {
      const faultyHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const normalHandler = vi.fn();
      const errorHandler = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      // コンソールエラーをモック
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on('error', errorHandler);
      eventBus.on(IdeaEvents.IDEA_ADDED, faultyHandler);
      eventBus.on(IdeaEvents.IDEA_ADDED, normalHandler);

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      expect(faultyHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(errorHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('リスナー数の管理', () => {
    it('getListenerCount でリスナー数を取得できること', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      expect(eventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(0);

      eventBus.on(IdeaEvents.IDEA_ADDED, handler1);
      expect(eventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(1);

      eventBus.on(IdeaEvents.IDEA_ADDED, handler2);
      expect(eventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(2);

      eventBus.once(IdeaEvents.IDEA_ADDED, vi.fn());
      expect(eventBus.getListenerCount(IdeaEvents.IDEA_ADDED)).toBe(3);
    });

    it('最大リスナー数を超えた場合に警告が出ること', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eventBusWithLimit = new EventBusImpl({ maxListeners: 2 });

      eventBusWithLimit.on(IdeaEvents.IDEA_ADDED, vi.fn());
      eventBusWithLimit.on(IdeaEvents.IDEA_ADDED, vi.fn());
      eventBusWithLimit.on(IdeaEvents.IDEA_ADDED, vi.fn()); // 3つ目で警告

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Max listeners (2) exceeded')
      );

      consoleSpy.mockRestore();
      eventBusWithLimit.clear();
    });
  });

  describe('clear メソッド', () => {
    it('すべてのリスナーがクリアされること', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const testData = { id: '1', text: 'test', timestamp: new Date() };

      eventBus.on(IdeaEvents.IDEA_ADDED, handler1);
      eventBus.on(IdeaEvents.IDEA_REMOVED, handler2);

      eventBus.clear();

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '1', timestamp: new Date() });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('バッチング機能', () => {
    it('バッチングが有効な場合、イベントがバッチ処理されること', async () => {
      const batchEventBus = new EventBusImpl({
        enableBatching: true,
        batchInterval: 10,
      });
      const handler = vi.fn();
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

      batchEventBus.on(IdeaEvents.IDEA_ADDED, handler);

      batchEventBus.emit(IdeaEvents.IDEA_ADDED, testData1);
      batchEventBus.emit(IdeaEvents.IDEA_ADDED, testData2);

      // バッチ処理前はまだ呼び出されていない
      expect(handler).not.toHaveBeenCalled();

      // バッチ処理を待つ
      await new Promise(resolve => setTimeout(resolve, 20));

      // バッチ処理後に呼び出される
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, testData1);
      expect(handler).toHaveBeenNthCalledWith(2, testData2);

      batchEventBus.clear();
    });
  });
});