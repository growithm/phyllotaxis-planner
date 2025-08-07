/**
 * PerformanceMonitor - ECSパフォーマンス監視システム
 * 
 * このモジュールは、ECSアーキテクチャにおけるシステム性能監視と
 * パフォーマンス最適化のための機能を提供します。
 */

export { PerformanceMonitor } from './PerformanceMonitor';
export { SystemMonitor } from './SystemMonitor';
export { MemoryMonitor } from './MemoryMonitor';
export { EntityMonitor } from './EntityMonitor';
export { ReportGenerator } from './ReportGenerator';

// 型定義のエクスポート
export type {
  PerformanceMonitorOptions,
  PerformanceReport,
  SystemMetrics,
  SystemExecutionRecord,
  SystemExecutionResult,
  MemorySnapshot,
  MemoryTrend,
  MemoryLeakReport,
  MemoryOptimizationSuggestion,
  EntityLifecycleStats,
  EntityCreationAnalysis,
  MemoryEfficiencyAnalysis,
  PerformanceImpactAnalysis,
  ExecutionToken
} from './types';