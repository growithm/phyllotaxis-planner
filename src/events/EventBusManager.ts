import { EventBus, EventBusOptions } from './core/EventBus';
import { EventBusImpl } from './core/EventBusImpl';
import { EventErrorHandler } from './handlers/ErrorHandler';
import { EventBatchProcessor } from './optimizations/BatchProcessor';
import { EventFilter, DuplicateEventFilter } from './filters/EventFilter';
import { EventLogger } from './debug/EventLogger';
import { EventPerformanceMonitor } from './debug/PerformanceMonitor';

export interface EventBusManagerOptions extends EventBusOptions {
  enableErrorHandling?: boolean;
  enableBatchProcessing?: boolean;
  enableFiltering?: boolean;
  enableLogging?: boolean;
  enablePerformanceMonitoring?: boolean;
  batchInterval?: number;
  maxLogs?: number;
}

/**
 * EventBusManager - 統合イベントバス管理クラス
 * 
 * EventBusとすべての拡張機能を統合管理し、
 * 設定に応じて機能を有効化/無効化できます。
 */
export class EventBusManager {
  private eventBus: EventBus;
  private errorHandler?: EventErrorHandler;
  private batchProcessor?: EventBatchProcessor;
  private eventFilter?: EventFilter;
  private duplicateFilter?: DuplicateEventFilter;
  private logger?: EventLogger;
  private performanceMonitor?: EventPerformanceMonitor;

  constructor(options: EventBusManagerOptions = {}) {
    // EventBusの作成
    this.eventBus = new EventBusImpl(options);

    // 機能の初期化
    this.initializeFeatures(options);
  }

  private initializeFeatures(options: EventBusManagerOptions): void {
    // エラーハンドリング
    if (options.enableErrorHandling !== false) {
      this.errorHandler = new EventErrorHandler(this.eventBus);
    }

    // バッチ処理
    if (options.enableBatchProcessing) {
      this.batchProcessor = new EventBatchProcessor(
        this.eventBus,
        options.batchInterval
      );
    }

    // フィルタリング
    if (options.enableFiltering) {
      this.eventFilter = new EventFilter();
      this.duplicateFilter = new DuplicateEventFilter();
    }

    // ロギング
    if (options.enableLogging !== false && process.env.NODE_ENV === 'development') {
      this.logger = new EventLogger(this.eventBus, options.maxLogs);
    }

    // パフォーマンス監視
    if (options.enablePerformanceMonitoring !== false && process.env.NODE_ENV === 'development') {
      this.performanceMonitor = new EventPerformanceMonitor(this.eventBus);
    }
  }

  /**
   * EventBusインスタンスを取得する
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * エラーハンドラーを取得する
   */
  getErrorHandler(): EventErrorHandler | undefined {
    return this.errorHandler;
  }

  /**
   * バッチプロセッサーを取得する
   */
  getBatchProcessor(): EventBatchProcessor | undefined {
    return this.batchProcessor;
  }

  /**
   * イベントフィルターを取得する
   */
  getEventFilter(): EventFilter | undefined {
    return this.eventFilter;
  }

  /**
   * 重複フィルターを取得する
   */
  getDuplicateFilter(): DuplicateEventFilter | undefined {
    return this.duplicateFilter;
  }

  /**
   * ロガーを取得する
   */
  getLogger(): EventLogger | undefined {
    return this.logger;
  }

  /**
   * パフォーマンスモニターを取得する
   */
  getPerformanceMonitor(): EventPerformanceMonitor | undefined {
    return this.performanceMonitor;
  }

  /**
   * デバッグ情報を取得する
   */
  getDebugInfo(): {
    eventStats?: Map<string, number>;
    errorStats?: Map<string, number>;
    performanceMetrics?: Map<string, unknown>;
    performanceSummary?: unknown;
  } {
    return {
      eventStats: this.logger?.getEventStats(),
      errorStats: this.errorHandler?.getErrorStats(),
      performanceMetrics: this.performanceMonitor?.getMetrics(),
      performanceSummary: this.performanceMonitor?.getPerformanceSummary()
    };
  }

  /**
   * すべての機能をクリーンアップする
   */
  cleanup(): void {
    this.eventBus.clear();
    this.batchProcessor?.clear();
    this.eventFilter?.clearFilters();
    this.duplicateFilter?.destroy();
    this.logger?.clearLogs();
    this.performanceMonitor?.clearMetrics();
    this.errorHandler?.clearErrorStats();
  }

  /**
   * デバッグ機能を無効化する
   */
  disableDebugFeatures(): void {
    this.logger?.disable();
    this.performanceMonitor?.disable();
  }
}