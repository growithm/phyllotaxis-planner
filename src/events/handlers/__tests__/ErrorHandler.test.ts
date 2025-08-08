import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { EventErrorHandler } from '@/events/handlers';
import { SystemEvents, UIEvents, TestEvents } from '@/events/types';
import type { ErrorEvent } from '@/events/types';

describe('EventErrorHandler', () => {
  let eventBus: EventBus;
  let errorHandler: EventErrorHandler;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    errorHandler = new EventErrorHandler(eventBus);
  });

  afterEach(() => {
    errorHandler.destroy();
    eventBus.clear();
  });

  describe('基本的なエラー処理', () => {
    it('エラーイベントを受信して処理すること', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Test error occurred',
        error: new Error('Test error'),
        recoverable: false,
        timestamp: new Date(),
      };

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TestSystem] Test error occurred',
        errorData.error
      );

      consoleSpy.mockRestore();
    });

    it('回復可能なエラーの場合、回復処理を実行すること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const recoveryHandler = vi.fn();
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Recoverable error',
        recoverable: true,
        recoveryEvent: 'test:recovery',
        recoveryData: { recovered: true },
        timestamp: new Date(),
      };

      eventBus.on('test:recovery', recoveryHandler);
      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(recoveryHandler).toHaveBeenCalledWith({ recovered: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Attempting recovery with test:recovery')
      );

      consoleSpy.mockRestore();
    });

    it('回復不可能なエラーの場合、モーダルを開くこと', () => {
      const modalHandler = vi.fn();
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Critical error',
        recoverable: false,
        timestamp: new Date(),
      };

      eventBus.on(UIEvents.MODAL_OPENED, modalHandler);
      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(modalHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          modalId: expect.stringContaining('error-'),
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('エラー統計', () => {
    it('エラー統計が正しく記録されること', () => {
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Test error',
        recoverable: false,
        timestamp: new Date(),
      };

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);
      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      const stats = errorHandler.getErrorStats();
      expect(stats.get('TestSystem:Test error')).toBe(2);
    });

    it('頻発するエラーに対して警告を出すこと', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Frequent error',
        recoverable: false,
        timestamp: new Date(),
      };

      // 6回同じエラーを発生させる（5回目で警告が出る）
      for (let i = 0; i < 6; i++) {
        eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Frequent error detected: TestSystem:Frequent error (6 times)')
      );

      consoleSpy.mockRestore();
    });

    it('エラー統計をクリアできること', () => {
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Test error',
        recoverable: false,
        timestamp: new Date(),
      };

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);
      expect(errorHandler.getErrorStats().size).toBe(1);

      errorHandler.clearErrorStats();
      expect(errorHandler.getErrorStats().size).toBe(0);
    });
  });

  describe('回復処理のエラーハンドリング', () => {
    it('回復処理が正常に実行されること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const recoveryHandler = vi.fn();
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Recoverable error',
        recoverable: true,
        recoveryEvent: 'test:recovery',
        recoveryData: { recovered: true },
        timestamp: new Date(),
      };

      eventBus.on('test:recovery', recoveryHandler);
      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(recoveryHandler).toHaveBeenCalledWith({ recovered: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        '[ErrorHandler] Recovery attempted for TestSystem'
      );

      consoleSpy.mockRestore();
    });

    it('回復データがない場合は回復処理をスキップすること', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'No recovery data',
        recoverable: true,
        recoveryEvent: 'test:recovery',
        // recoveryDataがない
        timestamp: new Date(),
      };

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      // 回復処理が実行されないことを確認
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Recovery attempted')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('開発環境での詳細ログ', () => {
    it('開発環境では詳細なエラー情報を表示すること', () => {
      // process.envをモック
      vi.stubEnv('NODE_ENV', 'development');

      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorData: ErrorEvent = {
        source: 'TestSystem',
        message: 'Critical error',
        error: new Error('Detailed error'),
        recoverable: false,
        timestamp: new Date(),
      };

      eventBus.emit(SystemEvents.ERROR_OCCURRED, errorData);

      expect(consoleGroupSpy).toHaveBeenCalledWith(
        '[ErrorHandler] Critical Error in TestSystem'
      );
      expect(consoleGroupEndSpy).toHaveBeenCalled();

      consoleGroupSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe('破棄処理', () => {
    it('destroy メソッドでリスナーが削除されること', () => {
      expect(eventBus.getListenerCount(SystemEvents.ERROR_OCCURRED)).toBe(1);

      errorHandler.destroy();

      expect(eventBus.getListenerCount(SystemEvents.ERROR_OCCURRED)).toBe(0);
      expect(errorHandler.getErrorStats().size).toBe(0);
    });
  });
});