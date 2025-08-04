import type { EventBus } from '@/events/core';

/**
 * イベントパフォーマンス指標
 */
export interface EventMetrics {
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  avgDuration: number;
  lastExecutionTime: Date;
}

/**
 * パフォーマンス警告
 */
export interface PerformanceWarning {
  event: string;
  type: 'slow_event' | 'frequent_event' | 'memory_usage';
  message: string;
  timestamp: Date;
  metrics: EventMetrics;
}

/**
 * イベントパフォーマンスモニタークラス
 * イベントの実行時間とパフォーマンス指標を監視
 */
export class EventPerformanceMonitor {
  private metrics = new Map<string, EventMetrics>();
  private warnings: PerformanceWarning[] = [];
  private originalEmit: typeof EventBus.prototype.emit;
  private slowEventThreshold: number;
  private frequentEventThreshold: number;
  private maxWarnings: number;

  constructor(
    private eventBus: EventBus,
    options: {
      slowEventThreshold?: number; // ミリ秒
      frequentEventThreshold?: number; // 1秒あたりの回数
      maxWarnings?: number;
    } = {}
  ) {
    this.slowEventThreshold = options.slowEventThreshold || 16; // 60fps基準
    this.frequentEventThreshold = options.frequentEventThreshold || 100;
    this.maxWarnings = options.maxWarnings || 100;
    
    this.originalEmit = this.eventBus.emit.bind(this.eventBus);
    this.setupMonitoring();
  }

  /**
   * パフォーマンス監視を設定する
   */
  private setupMonitoring(): void {
    this.eventBus.emit = <T>(event: string, data: T) => {
      const startTime = performance.now();
      const result = this.originalEmit(event, data);
      const endTime = performance.now();

      this.recordMetric(event, endTime - startTime);
      return result;
    };
  }

  /**
   * イベントの実行時間を記録する
   * @param event - イベント名
   * @param duration - 実行時間（ミリ秒）
   */
  private recordMetric(event: string, duration: number): void {
    if (!this.metrics.has(event)) {
      this.metrics.set(event, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        lastExecutionTime: new Date(),
      });
    }

    const metric = this.metrics.get(event)!;
    metric.count++;
    metric.totalDuration += duration;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.lastExecutionTime = new Date();

    // パフォーマンス警告をチェック
    this.checkPerformanceWarnings(event, metric, duration);
  }

  /**
   * パフォーマンス警告をチェックする
   * @param event - イベント名
   * @param metric - イベント指標
   * @param currentDuration - 現在の実行時間
   */
  private checkPerformanceWarnings(
    event: string,
    metric: EventMetrics,
    currentDuration: number
  ): void {
    // 遅いイベントの警告
    if (currentDuration > this.slowEventThreshold) {
      this.addWarning({
        event,
        type: 'slow_event',
        message: `Event "${event}" took ${currentDuration.toFixed(2)}ms to execute (threshold: ${this.slowEventThreshold}ms)`,
        timestamp: new Date(),
        metrics: { ...metric },
      });
    }

    // 頻繁なイベントの警告（1秒間に閾値を超えた場合）
    const recentCount = this.getRecentEventCount(event, 1000); // 1秒間
    if (recentCount > this.frequentEventThreshold) {
      this.addWarning({
        event,
        type: 'frequent_event',
        message: `Event "${event}" fired ${recentCount} times in the last second (threshold: ${this.frequentEventThreshold})`,
        timestamp: new Date(),
        metrics: { ...metric },
      });
    }
  }

  /**
   * 指定時間内のイベント発生回数を取得する
   * @param event - イベント名
   * @param timeWindowMs - 時間窓（ミリ秒）
   * @returns イベント発生回数
   */
  private getRecentEventCount(event: string, timeWindowMs: number): number {
    // 簡易実装：実際の実装では時系列データを保持する必要がある
    const metric = this.metrics.get(event);
    if (!metric) return 0;

    const now = new Date();
    const timeDiff = now.getTime() - metric.lastExecutionTime.getTime();
    
    // 最後の実行から時間窓内の場合、概算で計算
    if (timeDiff < timeWindowMs) {
      return Math.ceil(metric.count * (timeWindowMs / Math.max(timeDiff, 1)));
    }

    return 0;
  }

  /**
   * 警告を追加する
   * @param warning - 警告情報
   */
  private addWarning(warning: PerformanceWarning): void {
    this.warnings.push(warning);

    // 最大警告数を超えた場合、古い警告を削除
    if (this.warnings.length > this.maxWarnings) {
      this.warnings.shift();
    }

    // 開発環境では警告をコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PerformanceMonitor] ${warning.message}`);
    }
  }

  /**
   * すべてのイベント指標を取得する
   * @returns イベント指標のマップ
   */
  getMetrics(): Map<string, EventMetrics> {
    return new Map(this.metrics);
  }

  /**
   * 特定のイベントの指標を取得する
   * @param event - イベント名
   * @returns イベント指標（存在しない場合はundefined）
   */
  getEventMetrics(event: string): EventMetrics | undefined {
    const metric = this.metrics.get(event);
    return metric ? { ...metric } : undefined;
  }

  /**
   * 遅いイベントを取得する
   * @param threshold - 閾値（省略時はデフォルト閾値を使用）
   * @returns 遅いイベントの配列
   */
  getSlowEvents(threshold?: number): Array<{ event: string; metrics: EventMetrics }> {
    const actualThreshold = threshold || this.slowEventThreshold;
    
    return Array.from(this.metrics.entries())
      .filter(([, metrics]) => metrics.avgDuration > actualThreshold)
      .map(([event, metrics]) => ({ event, metrics: { ...metrics } }))
      .sort((a, b) => b.metrics.avgDuration - a.metrics.avgDuration);
  }

  /**
   * 頻繁なイベントを取得する
   * @param threshold - 閾値（省略時はデフォルト閾値を使用）
   * @returns 頻繁なイベントの配列
   */
  getFrequentEvents(threshold?: number): Array<{ event: string; metrics: EventMetrics }> {
    const actualThreshold = threshold || this.frequentEventThreshold;
    
    return Array.from(this.metrics.entries())
      .filter(([, metrics]) => metrics.count > actualThreshold)
      .map(([event, metrics]) => ({ event, metrics: { ...metrics } }))
      .sort((a, b) => b.metrics.count - a.metrics.count);
  }

  /**
   * パフォーマンス警告を取得する
   * @param type - 警告タイプ（省略時は全て）
   * @returns 警告の配列
   */
  getWarnings(type?: PerformanceWarning['type']): PerformanceWarning[] {
    return type 
      ? this.warnings.filter(warning => warning.type === type)
      : [...this.warnings];
  }

  /**
   * パフォーマンスサマリーを取得する
   * @returns パフォーマンスサマリー
   */
  getPerformanceSummary(): {
    totalEvents: number;
    uniqueEvents: number;
    slowEvents: number;
    totalWarnings: number;
    avgExecutionTime: number;
  } {
    const totalEvents = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.count, 0);
    
    const slowEvents = this.getSlowEvents().length;
    
    const totalDuration = Array.from(this.metrics.values())
      .reduce((sum, metric) => sum + metric.totalDuration, 0);
    
    const avgExecutionTime = totalEvents > 0 ? totalDuration / totalEvents : 0;

    return {
      totalEvents,
      uniqueEvents: this.metrics.size,
      slowEvents,
      totalWarnings: this.warnings.length,
      avgExecutionTime,
    };
  }

  /**
   * 指標をリセットする
   */
  resetMetrics(): void {
    this.metrics.clear();
    this.warnings = [];
  }

  /**
   * 設定を更新する
   * @param options - 更新オプション
   */
  updateSettings(options: {
    slowEventThreshold?: number;
    frequentEventThreshold?: number;
    maxWarnings?: number;
  }): void {
    if (options.slowEventThreshold !== undefined) {
      this.slowEventThreshold = options.slowEventThreshold;
    }
    if (options.frequentEventThreshold !== undefined) {
      this.frequentEventThreshold = options.frequentEventThreshold;
    }
    if (options.maxWarnings !== undefined) {
      this.maxWarnings = options.maxWarnings;
      // 現在の警告数が新しい上限を超えている場合は調整
      if (this.warnings.length > this.maxWarnings) {
        this.warnings = this.warnings.slice(-this.maxWarnings);
      }
    }
  }

  /**
   * モニターを破棄する
   */
  public destroy(): void {
    // 元のemitメソッドを復元
    this.eventBus.emit = this.originalEmit;
    this.resetMetrics();
  }
}