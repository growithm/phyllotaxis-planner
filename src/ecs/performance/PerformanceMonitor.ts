/**
 * PerformanceMonitor - ECSパフォーマンス監視のメインクラス
 */

import type { IWorld } from '@/ecs/core/System';
import { SystemMonitor } from './SystemMonitor';
import { MemoryMonitor } from './MemoryMonitor';
import { EntityMonitor } from './EntityMonitor';
import { ReportGenerator } from './ReportGenerator';
import type {
  PerformanceMonitorOptions,
  PerformanceReport
} from './types';

/**
 * PerformanceMonitor
 * 
 * ECSアーキテクチャの総合的なパフォーマンス監視を提供します。
 * システム実行時間、メモリ使用量、エンティティライフサイクルを監視し、
 * パフォーマンス分析とレポート生成を行います。
 */
export class PerformanceMonitor {
  private world: IWorld;
  private systemMonitor: SystemMonitor;
  private memoryMonitor: MemoryMonitor;
  private entityMonitor: EntityMonitor;
  private reportGenerator: ReportGenerator;
  private isEnabled: boolean;
  private options: Required<PerformanceMonitorOptions>;

  constructor(world: IWorld, options: PerformanceMonitorOptions = {}) {
    this.world = world;
    this.isEnabled = options.enabled !== false;
    
    // デフォルトオプションの設定
    this.options = this.mergeWithDefaults(options);
    
    // 監視コンポーネントの初期化
    this.systemMonitor = new SystemMonitor(world);
    this.memoryMonitor = new MemoryMonitor(world, {
      enableContinuousMonitoring: this.options.metricsOptions.enableDetailedMetrics,
      monitoringInterval: this.options.metricsOptions.aggregationInterval
    });
    this.entityMonitor = new EntityMonitor(world);
    this.reportGenerator = new ReportGenerator(this);
    
    if (this.isEnabled) {
      this.setupMonitoring();
    }
  }

  /**
   * システム監視インスタンスを取得
   */
  getSystemMonitor(): SystemMonitor {
    return this.systemMonitor;
  }

  /**
   * メモリ監視インスタンスを取得
   */
  getMemoryMonitor(): MemoryMonitor {
    return this.memoryMonitor;
  }

  /**
   * エンティティ監視インスタンスを取得
   */
  getEntityMonitor(): EntityMonitor {
    return this.entityMonitor;
  }

  /**
   * レポート生成インスタンスを取得
   */
  getReportGenerator(): ReportGenerator {
    return this.reportGenerator;
  }

  /**
   * 総合パフォーマンスレポートを生成
   */
  generateReport(): PerformanceReport {
    if (!this.isEnabled) {
      throw new Error('PerformanceMonitor is disabled');
    }
    
    return this.reportGenerator.generateComprehensiveReport();
  }

  /**
   * パフォーマンス監視を有効化
   */
  enable(): void {
    if (this.isEnabled) return;
    
    this.isEnabled = true;
    this.setupMonitoring();
  }

  /**
   * パフォーマンス監視を無効化
   */
  disable(): void {
    if (!this.isEnabled) return;
    
    this.isEnabled = false;
    this.teardownMonitoring();
  }

  /**
   * 監視が有効かどうかを確認
   */
  isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 監視設定を更新
   */
  updateSettings(newOptions: Partial<PerformanceMonitorOptions>): void {
    this.options = this.mergeWithDefaults({ ...this.options, ...newOptions });
    
    if (this.isEnabled) {
      this.teardownMonitoring();
      this.setupMonitoring();
    }
  }

  /**
   * 全ての統計をリセット
   */
  resetAllStats(): void {
    this.systemMonitor.resetStats();
    this.memoryMonitor.resetStats();
    this.entityMonitor.resetStats();
  }

  /**
   * 現在の設定を取得
   */
  getSettings(): Required<PerformanceMonitorOptions> {
    return { ...this.options };
  }

  /**
   * 監視のセットアップ
   */
  private setupMonitoring(): void {
    // 継続的メモリ監視の開始
    if (this.options.metricsOptions.enableDetailedMetrics) {
      this.memoryMonitor.startContinuousMonitoring(
        this.options.metricsOptions.aggregationInterval
      );
    }

    // 自動レポート生成の設定
    if (this.options.reportOptions.enableAutoReports) {
      this.setupAutoReporting();
    }
  }

  /**
   * 監視の終了処理
   */
  private teardownMonitoring(): void {
    this.memoryMonitor.stopContinuousMonitoring();
    // 他の監視の停止処理があれば追加
  }

  /**
   * 自動レポート生成の設定
   */
  private setupAutoReporting(): void {
    const interval = this.options.reportOptions.reportInterval;
    
    setInterval(() => {
      if (this.isEnabled) {
        const report = this.generateReport();
        this.handleAutoReport(report);
      }
    }, interval);
  }

  /**
   * 自動レポートの処理
   */
  private handleAutoReport(report: PerformanceReport): void {
    // 実装: レポートの保存、ログ出力、アラート送信など
    console.log('Auto Performance Report:', {
      timestamp: report.timestamp,
      summary: report.summary,
      alertCount: report.alerts.length
    });
  }

  /**
   * デフォルトオプションとのマージ
   */
  private mergeWithDefaults(options: PerformanceMonitorOptions): Required<PerformanceMonitorOptions> {
    return {
      enabled: options.enabled ?? true,
      
      metricsOptions: {
        maxHistorySize: options.metricsOptions?.maxHistorySize ?? 1000,
        aggregationInterval: options.metricsOptions?.aggregationInterval ?? 1000,
        enableDetailedMetrics: options.metricsOptions?.enableDetailedMetrics ?? true,
      },

      analysisOptions: {
        enableLeakDetection: options.analysisOptions?.enableLeakDetection ?? true,
        enableBottleneckDetection: options.analysisOptions?.enableBottleneckDetection ?? true,
        performanceThresholds: {
          slowSystemThreshold: options.analysisOptions?.performanceThresholds?.slowSystemThreshold ?? 5.0,
          highMemoryThreshold: options.analysisOptions?.performanceThresholds?.highMemoryThreshold ?? 50 * 1024 * 1024,
          highEntityCountThreshold: options.analysisOptions?.performanceThresholds?.highEntityCountThreshold ?? 100,
        },
      },

      alertOptions: {
        enableAlerts: options.alertOptions?.enableAlerts ?? true,
        alertThresholds: {
          systemExecutionTime: options.alertOptions?.alertThresholds?.systemExecutionTime ?? 10.0,
          memoryUsage: options.alertOptions?.alertThresholds?.memoryUsage ?? 100 * 1024 * 1024,
          entityCreationRate: options.alertOptions?.alertThresholds?.entityCreationRate ?? 10.0,
        },
      },

      reportOptions: {
        enableAutoReports: options.reportOptions?.enableAutoReports ?? false,
        reportInterval: options.reportOptions?.reportInterval ?? 60000,
        reportFormat: options.reportOptions?.reportFormat ?? 'json',
      },
    };
  }
}