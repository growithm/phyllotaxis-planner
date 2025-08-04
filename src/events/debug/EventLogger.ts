import type { EventBus } from '@/events/core';

/**
 * イベントログエントリ
 */
export interface EventLog {
  event: string;
  data: unknown;
  timestamp: Date;
  stackTrace?: string;
  id: string;
}

/**
 * イベントロガークラス
 * すべてのイベントをログに記録し、デバッグ情報を提供
 */
export class EventLogger {
  private logs: EventLog[] = [];
  private logIdCounter = 0;
  private originalEmit: <T>(event: string, data: T) => void;

  constructor(
    private eventBus: EventBus,
    private maxLogs: number = 1000,
    private enableStackTrace: boolean = false
  ) {
    this.originalEmit = this.eventBus.emit.bind(this.eventBus);
    this.setupLogging();
  }

  /**
   * ログ機能を設定する
   */
  private setupLogging(): void {
    // EventBusのemitメソッドをラップ
    this.eventBus.emit = <T>(event: string, data: T) => {
      this.logEvent(event, data);
      return this.originalEmit(event, data);
    };
  }

  /**
   * イベントをログに記録する
   * @param event - イベント名
   * @param data - イベントデータ
   */
  private logEvent<T>(event: string, data: T): void {
    const log: EventLog = {
      id: `log-${++this.logIdCounter}`,
      event,
      data,
      timestamp: new Date(),
      stackTrace: this.enableStackTrace ? new Error().stack : undefined,
    };

    this.logs.push(log);

    // 最大ログ数を超えた場合、古いログを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 開発環境では詳細ログを出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventLogger] ${event}`, data);
    }
  }

  /**
   * ログを取得する
   * @param filter - フィルター関数（省略可）
   * @returns フィルターされたログ配列
   */
  getLogs(filter?: (log: EventLog) => boolean): EventLog[] {
    return filter ? this.logs.filter(filter) : [...this.logs];
  }

  /**
   * 特定のイベントのログを取得する
   * @param eventName - イベント名
   * @returns 該当するログ配列
   */
  getLogsByEvent(eventName: string): EventLog[] {
    return this.logs.filter(log => log.event === eventName);
  }

  /**
   * 時間範囲でログを取得する
   * @param startTime - 開始時間
   * @param endTime - 終了時間
   * @returns 該当するログ配列
   */
  getLogsByTimeRange(startTime: Date, endTime: Date): EventLog[] {
    return this.logs.filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * 最新のログを取得する
   * @param count - 取得するログ数
   * @returns 最新のログ配列
   */
  getRecentLogs(count: number): EventLog[] {
    return this.logs.slice(-count);
  }

  /**
   * イベント統計を取得する
   * @returns イベント名とその発生回数のマップ
   */
  getEventStats(): Map<string, number> {
    const stats = new Map<string, number>();

    this.logs.forEach(log => {
      const count = stats.get(log.event) || 0;
      stats.set(log.event, count + 1);
    });

    return stats;
  }

  /**
   * 時間別イベント統計を取得する
   * @param intervalMinutes - 集計間隔（分）
   * @returns 時間別統計
   */
  getTimeBasedStats(intervalMinutes: number = 5): Map<string, number> {
    const stats = new Map<string, number>();
    const intervalMs = intervalMinutes * 60 * 1000;

    this.logs.forEach(log => {
      const timeSlot = Math.floor(log.timestamp.getTime() / intervalMs) * intervalMs;
      const timeKey = new Date(timeSlot).toISOString();
      const count = stats.get(timeKey) || 0;
      stats.set(timeKey, count + 1);
    });

    return stats;
  }

  /**
   * ログをクリアする
   */
  clearLogs(): void {
    this.logs = [];
    this.logIdCounter = 0;
  }

  /**
   * ログをJSON形式でエクスポートする
   * @returns JSON文字列
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * ログをCSV形式でエクスポートする
   * @returns CSV文字列
   */
  exportLogsAsCSV(): string {
    if (this.logs.length === 0) {
      return 'id,event,timestamp,data\n';
    }

    const header = 'id,event,timestamp,data\n';
    const rows = this.logs.map(log => {
      const data = JSON.stringify(log.data).replace(/"/g, '""');
      return `${log.id},"${log.event}","${log.timestamp.toISOString()}","${data}"`;
    }).join('\n');

    return header + rows;
  }

  /**
   * ログ設定を更新する
   * @param options - 更新オプション
   */
  updateSettings(options: {
    maxLogs?: number;
    enableStackTrace?: boolean;
  }): void {
    if (options.maxLogs !== undefined) {
      this.maxLogs = options.maxLogs;
      // 現在のログ数が新しい上限を超えている場合は調整
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs);
      }
    }

    if (options.enableStackTrace !== undefined) {
      this.enableStackTrace = options.enableStackTrace;
    }
  }

  /**
   * ロガーを破棄する
   */
  public destroy(): void {
    // 元のemitメソッドを復元
    this.eventBus.emit = this.originalEmit;
    this.clearLogs();
  }
}