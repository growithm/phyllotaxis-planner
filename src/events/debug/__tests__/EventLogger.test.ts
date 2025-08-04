import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusImpl } from '@/events/core';
import type { EventBus } from '@/events/core';
import { EventLogger } from '@/events/debug';
import { IdeaEvents } from '@/events/types';

describe('EventLogger', () => {
  let eventBus: EventBus;
  let eventLogger: EventLogger;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    eventLogger = new EventLogger(eventBus, 100); // 最大100ログ
  });

  afterEach(() => {
    eventLogger.destroy();
    eventBus.clear();
  });

  describe('基本的なログ機能', () => {
    it('イベントがログに記録されること', () => {
      const testData = { id: '1', text: 'test', timestamp: new Date() };
      
      eventBus.emit(IdeaEvents.IDEA_ADDED, testData);

      const logs = eventLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].event).toBe(IdeaEvents.IDEA_ADDED);
      expect(logs[0].data).toEqual(testData);
      expect(logs[0].timestamp).toBeInstanceOf(Date);
      expect(logs[0].id).toMatch(/^log-\d+$/);
    });

    it('複数のイベントがログに記録されること', () => {
      const testData1 = { id: '1', text: 'test1', timestamp: new Date() };
      const testData2 = { id: '2', text: 'test2', timestamp: new Date() };

      eventBus.emit(IdeaEvents.IDEA_ADDED, testData1);
      eventBus.emit(IdeaEvents.IDEA_REMOVED, testData2);

      const logs = eventLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].event).toBe(IdeaEvents.IDEA_ADDED);
      expect(logs[1].event).toBe(IdeaEvents.IDEA_REMOVED);
    });

    it('最大ログ数を超えた場合、古いログが削除されること', () => {
      const smallLogger = new EventLogger(eventBus, 2); // 最大2ログ

      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1' });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2' });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '3' });

      const logs = smallLogger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].data.id).toBe('2'); // 最初のログが削除されている
      expect(logs[1].data.id).toBe('3');

      smallLogger.destroy();
    });
  });

  describe('ログフィルタリング', () => {
    beforeEach(() => {
      // テストデータを準備
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test1' });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '2' });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '3', text: 'test3' });
    });

    it('フィルター関数でログを絞り込めること', () => {
      const filteredLogs = eventLogger.getLogs(log => log.event === IdeaEvents.IDEA_ADDED);
      
      expect(filteredLogs).toHaveLength(2);
      expect(filteredLogs.every(log => log.event === IdeaEvents.IDEA_ADDED)).toBe(true);
    });

    it('特定のイベントのログを取得できること', () => {
      const ideaAddedLogs = eventLogger.getLogsByEvent(IdeaEvents.IDEA_ADDED);
      
      expect(ideaAddedLogs).toHaveLength(2);
      expect(ideaAddedLogs.every(log => log.event === IdeaEvents.IDEA_ADDED)).toBe(true);
    });

    it('時間範囲でログを取得できること', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      const oneMinuteLater = new Date(now.getTime() + 60000);

      const logsInRange = eventLogger.getLogsByTimeRange(oneMinuteAgo, oneMinuteLater);
      
      expect(logsInRange).toHaveLength(3); // すべてのログが範囲内
    });

    it('最新のログを取得できること', () => {
      const recentLogs = eventLogger.getRecentLogs(2);
      
      expect(recentLogs).toHaveLength(2);
      expect(recentLogs[0].data.id).toBe('2'); // 2番目のログ
      expect(recentLogs[1].data.id).toBe('3'); // 3番目のログ（最新）
    });
  });

  describe('統計機能', () => {
    beforeEach(() => {
      // テストデータを準備
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1' });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2' });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '3' });
      eventBus.emit(IdeaEvents.IDEA_UPDATED, { id: '4' });
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '5' });
    });

    it('イベント統計を取得できること', () => {
      const stats = eventLogger.getEventStats();
      
      expect(stats.get(IdeaEvents.IDEA_ADDED)).toBe(3);
      expect(stats.get(IdeaEvents.IDEA_REMOVED)).toBe(1);
      expect(stats.get(IdeaEvents.IDEA_UPDATED)).toBe(1);
    });

    it('時間別統計を取得できること', () => {
      const timeStats = eventLogger.getTimeBasedStats(5); // 5分間隔
      
      expect(timeStats.size).toBeGreaterThan(0);
      // 現在の時間スロットにすべてのイベントが含まれているはず
      const totalEvents = Array.from(timeStats.values()).reduce((sum, count) => sum + count, 0);
      expect(totalEvents).toBe(5);
    });
  });

  describe('エクスポート機能', () => {
    beforeEach(() => {
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test' });
      eventBus.emit(IdeaEvents.IDEA_REMOVED, { id: '2' });
    });

    it('ログをJSON形式でエクスポートできること', () => {
      const jsonExport = eventLogger.exportLogs();
      const parsedLogs = JSON.parse(jsonExport);
      
      expect(Array.isArray(parsedLogs)).toBe(true);
      expect(parsedLogs).toHaveLength(2);
      expect(parsedLogs[0]).toHaveProperty('event');
      expect(parsedLogs[0]).toHaveProperty('data');
      expect(parsedLogs[0]).toHaveProperty('timestamp');
    });

    it('ログをCSV形式でエクスポートできること', () => {
      const csvExport = eventLogger.exportLogsAsCSV();
      const lines = csvExport.split('\n');
      
      expect(lines[0]).toBe('id,event,timestamp,data'); // ヘッダー
      expect(lines).toHaveLength(3); // ヘッダー + 2データ行
      expect(lines[1]).toContain(IdeaEvents.IDEA_ADDED);
      expect(lines[2]).toContain(IdeaEvents.IDEA_REMOVED);
    });

    it('空のログでもCSVヘッダーが出力されること', () => {
      const emptyLogger = new EventLogger(eventBus);
      const csvExport = emptyLogger.exportLogsAsCSV();
      
      expect(csvExport).toBe('id,event,timestamp,data\n');
      
      emptyLogger.destroy();
    });
  });

  describe('設定管理', () => {
    it('設定を更新できること', () => {
      eventLogger.updateSettings({
        maxLogs: 5,
        enableStackTrace: true
      });

      // 6個のイベントを発行
      for (let i = 1; i <= 6; i++) {
        eventBus.emit(IdeaEvents.IDEA_ADDED, { id: i.toString() });
      }

      const logs = eventLogger.getLogs();
      expect(logs).toHaveLength(5); // maxLogsが5に制限されている
      expect(logs[0].stackTrace).toBeDefined(); // スタックトレースが有効
    });

    it('maxLogsを小さくした場合、既存のログが調整されること', () => {
      // 5個のイベントを発行
      for (let i = 1; i <= 5; i++) {
        eventBus.emit(IdeaEvents.IDEA_ADDED, { id: i.toString() });
      }

      expect(eventLogger.getLogs()).toHaveLength(5);

      // maxLogsを3に変更
      eventLogger.updateSettings({ maxLogs: 3 });

      const logs = eventLogger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].data.id).toBe('3'); // 最新の3つが残る
      expect(logs[2].data.id).toBe('5');
    });
  });

  describe('スタックトレース', () => {
    it('スタックトレースが有効な場合、記録されること', () => {
      const loggerWithStack = new EventLogger(eventBus, 100, true);
      
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1' });

      const logs = loggerWithStack.getLogs();
      expect(logs[0].stackTrace).toBeDefined();
      expect(typeof logs[0].stackTrace).toBe('string');

      loggerWithStack.destroy();
    });

    it('スタックトレースが無効な場合、記録されないこと', () => {
      const loggerWithoutStack = new EventLogger(eventBus, 100, false);
      
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1' });

      const logs = loggerWithoutStack.getLogs();
      expect(logs[0].stackTrace).toBeUndefined();

      loggerWithoutStack.destroy();
    });
  });

  describe('開発環境でのログ出力', () => {
    it('開発環境ではコンソールにログが出力されること', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        `[EventLogger] ${IdeaEvents.IDEA_ADDED}`,
        { id: '1', text: 'test' }
      );

      consoleSpy.mockRestore();
      vi.unstubAllEnvs();
    });
  });

  describe('破棄処理', () => {
    it('destroy でロガーが正しく破棄されること', () => {
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '1' });
      expect(eventLogger.getLogs()).toHaveLength(1);

      eventLogger.destroy();

      // 破棄後はログがクリアされる
      expect(eventLogger.getLogs()).toHaveLength(0);

      // 破棄後はイベントがログされない
      eventBus.emit(IdeaEvents.IDEA_ADDED, { id: '2' });
      expect(eventLogger.getLogs()).toHaveLength(0);
    });
  });
});