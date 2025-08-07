/**
 * PerformanceMonitor型定義
 */

import type { ComponentType } from '@/ecs/core/Component';
import type { EntityId } from '@/ecs/core/Entity';

// 基本型定義
export type ExecutionToken = string;

// PerformanceMonitor設定
export interface PerformanceMonitorOptions {
  enabled?: boolean;
  
  metricsOptions?: {
    maxHistorySize?: number;
    aggregationInterval?: number;
    enableDetailedMetrics?: boolean;
  };

  analysisOptions?: {
    enableLeakDetection?: boolean;
    enableBottleneckDetection?: boolean;
    performanceThresholds?: {
      slowSystemThreshold?: number;
      highMemoryThreshold?: number;
      highEntityCountThreshold?: number;
    };
  };

  alertOptions?: {
    enableAlerts?: boolean;
    alertThresholds?: {
      systemExecutionTime?: number;
      memoryUsage?: number;
      entityCreationRate?: number;
    };
  };

  reportOptions?: {
    enableAutoReports?: boolean;
    reportInterval?: number;
    reportFormat?: 'json' | 'html' | 'csv';
  };
}

// システム監視関連
export interface SystemExecutionRecord {
  systemName: string;
  startTime: number;
  endTime: number;
  executionTime: number;
  processedEntities: number;
  memoryUsage: number;
  memoryDelta: number;
  timestamp: Date;
}

export interface SystemExecutionResult {
  executionTime: number;
  memoryDelta: number;
  processedEntities: number;
  performanceScore: number;
}

export interface SystemMetrics {
  systemName: string;
  totalExecutions: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  totalProcessedEntities: number;
  averageProcessedEntities: number;
  totalMemoryUsage: number;
  averageMemoryUsage: number;
  lastExecution: SystemExecutionRecord | null;
  performanceScore: number;
  alertCount: number;
}

// メモリ監視関連
export interface MemorySnapshot {
  timestamp: number;
  totalMemory: number;
  heapUsed: number;
  heapTotal: number;
  entityCount: number;
  componentCount: number;
  estimatedEntityMemory: number;
  estimatedComponentMemory: number;
  memoryPerEntity: number;
  memoryPerComponent: number;
  fragmentationRatio: number;
}

export interface MemoryTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // bytes per second
  peakMemory: number;
  averageMemory: number;
  snapshots: MemorySnapshot[];
}

export interface MemoryLeakReport {
  isLeaking: boolean;
  confidence: number;
  suspiciousPatterns: string[];
  recommendation: string[];
  trend: MemoryTrend;
}

export interface MemoryOptimizationSuggestion {
  type: 'entity-optimization' | 'component-optimization' | 'fragmentation-reduction';
  priority: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  estimatedSaving: number;
}

export interface MemoryAlert {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
  value: number;
  threshold: number;
}

export interface MemoryMonitorOptions {
  enableContinuousMonitoring?: boolean;
  monitoringInterval?: number;
}

// エンティティ監視関連
export interface EntityLifecycleStats {
  totalCreated: number;
  totalDestroyed: number;
  currentActive: number;
  peakActive: number;
  creationRate: number; // entities per second
  destructionRate: number; // entities per second
  averageLifespan: number; // milliseconds
}

export interface EntityCreationRecord {
  entityId: EntityId;
  timestamp: number;
  componentCount: number;
  memoryEstimate: number;
}

export interface EntityDestructionRecord {
  entityId: EntityId;
  timestamp: number;
  lifespan: number;
  componentCount: number;
}

export interface ComponentUsageStats {
  componentType: ComponentType;
  totalAdded: number;
  totalRemoved: number;
  currentCount: number;
  peakCount: number;
  averageLifespan: number;
  additionRate: number;
  removalRate: number;
}

export type EntityCreationPattern = 'steady' | 'bursty' | 'irregular' | 'insufficient-data';

export interface EntityCreationAnalysis {
  pattern: EntityCreationPattern;
  burstDetected: boolean;
  averageInterval: number;
  peakCreationRate: number;
  recommendations: string[];
}

export interface MemoryEfficiencyAnalysis {
  totalMemoryUsage: number;
  averageMemoryPerEntity: number;
  componentMemoryBreakdown: Record<ComponentType, number>;
  efficiency: number;
  recommendations: string[];
}

export interface PerformanceImpactAnalysis {
  entityCount: number;
  componentCount: number;
  entityDensity: number;
  predictedQueryTime: number;
  predictedUpdateTime: number;
  bottlenecks: string[];
  recommendations: string[];
}

// レポート関連
export interface PerformanceReport {
  timestamp: Date;
  summary: string;
  systemPerformance: {
    totalSystems: number;
    averagePerformanceScore: number;
    slowestSystems: SystemMetrics[];
    fastestSystems: SystemMetrics[];
  };
  memoryAnalysis: {
    currentTrend: string;
    changeRate: number;
    peakMemory: number;
    leakDetection: MemoryLeakReport;
  };
  entityAnalysis: {
    activeEntities: number;
    creationRate: number;
    destructionRate: number;
    averageLifespan: number;
  };
  recommendations: string[];
  alerts: MemoryAlert[];
}

// 内部実装用型
export interface ExecutionContext {
  systemName: string;
  startTime: number;
  startMemory: number;
  token: ExecutionToken;
}