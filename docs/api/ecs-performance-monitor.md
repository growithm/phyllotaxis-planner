---
title: "PerformanceMonitor API仕様"
type: api
category: ecs
tags: [api, ecs, performance, monitoring, typescript]
related:
  - "[[../architecture/ecs/performance-monitor]]"
  - "[[ecs-query-system]]"
  - "[[world-integration]]"
created: 2025-02-08
---

# PerformanceMonitor API仕様

> [!info] 概要
> ECSアーキテクチャにおけるPerformanceMonitorの完全なAPI仕様書です。

## 📋 目次

- [PerformanceMonitor クラス](#performancemonitor-クラス)
- [SystemMonitor クラス](#systemmonitor-クラス)
- [MemoryMonitor クラス](#memorymonitor-クラス)
- [EntityMonitor クラス](#entitymonitor-クラス)
- [ReportGenerator クラス](#reportgenerator-クラス)
- [型定義](#型定義)
- [使用例](#使用例)

## PerformanceMonitor クラス

### コンストラクタ

```typescript
constructor(world: IWorld, options?: PerformanceMonitorOptions)
```

**パラメータ:**
- `world: IWorld` - 監視対象のWorldインスタンス
- `options?: PerformanceMonitorOptions` - 監視オプション

**例:**
```typescript
const performanceMonitor = new PerformanceMonitor(world, {
  enabled: true,
  metricsOptions: { maxHistorySize: 1000 },
  analysisOptions: { enableLeakDetection: true },
  alertOptions: { enableAlerts: true }
});
```

### メソッド

#### getSystemMonitor

```typescript
getSystemMonitor(): SystemMonitor
```

システム監視インスタンスを取得します。

**戻り値:**
- `SystemMonitor` - システム監視インスタンス

#### getMemoryMonitor

```typescript
getMemoryMonitor(): MemoryMonitor
```

メモリ監視インスタンスを取得します。

**戻り値:**
- `MemoryMonitor` - メモリ監視インスタンス

#### getEntityMonitor

```typescript
getEntityMonitor(): EntityMonitor
```

エンティティ監視インスタンスを取得します。

**戻り値:**
- `EntityMonitor` - エンティティ監視インスタンス

#### generateReport

```typescript
generateReport(): PerformanceReport
```

総合パフォーマンスレポートを生成します。

**戻り値:**
- `PerformanceReport` - パフォーマンスレポート

#### enable

```typescript
enable(): void
```

パフォーマンス監視を有効にします。

#### disable

```typescript
disable(): void
```

パフォーマンス監視を無効にします。

#### isEnabled

```typescript
isEnabled(): boolean
```

監視が有効かどうかを確認します。

**戻り値:**
- `boolean` - 有効状態#
# SystemMonitor クラス

### メソッド

#### startSystemExecution

```typescript
startSystemExecution(systemName: string): ExecutionToken
```

システム実行の監視を開始します。

**パラメータ:**
- `systemName: string` - システム名

**戻り値:**
- `ExecutionToken` - 実行トークン

**例:**
```typescript
const token = systemMonitor.startSystemExecution('PhyllotaxisSystem');
```

#### endSystemExecution

```typescript
endSystemExecution(token: ExecutionToken, processedEntities?: number): SystemExecutionResult
```

システム実行の監視を終了します。

**パラメータ:**
- `token: ExecutionToken` - 実行トークン
- `processedEntities?: number` - 処理されたエンティティ数

**戻り値:**
- `SystemExecutionResult` - 実行結果

**例:**
```typescript
const result = systemMonitor.endSystemExecution(token, 25);
console.log(`Execution time: ${result.executionTime}ms`);
```

#### getSystemMetrics

```typescript
getSystemMetrics(systemName?: string): SystemMetrics[]
```

システムメトリクスを取得します。

**パラメータ:**
- `systemName?: string` - 特定のシステム名（省略時は全システム）

**戻り値:**
- `SystemMetrics[]` - システムメトリクスの配列

#### getRecentExecutions

```typescript
getRecentExecutions(systemName: string, count?: number): SystemExecutionRecord[]
```

最近の実行記録を取得します。

**パラメータ:**
- `systemName: string` - システム名
- `count?: number` - 取得数（デフォルト: 50）

**戻り値:**
- `SystemExecutionRecord[]` - 実行記録の配列

#### getSlowSystems

```typescript
getSlowSystems(threshold?: number): SystemMetrics[]
```

遅いシステムを検出します。

**パラメータ:**
- `threshold?: number` - 閾値（ミリ秒、デフォルト: 5.0）

**戻り値:**
- `SystemMetrics[]` - 遅いシステムのメトリクス

#### resetStats

```typescript
resetStats(): void
```

統計をリセットします。

## MemoryMonitor クラス

### メソッド

#### takeSnapshot

```typescript
takeSnapshot(): MemorySnapshot
```

メモリスナップショットを取得します。

**戻り値:**
- `MemorySnapshot` - メモリスナップショット

**例:**
```typescript
const snapshot = memoryMonitor.takeSnapshot();
console.log(`Total memory: ${snapshot.totalMemory} bytes`);
```

#### startContinuousMonitoring

```typescript
startContinuousMonitoring(interval?: number): void
```

継続的なメモリ監視を開始します。

**パラメータ:**
- `interval?: number` - 監視間隔（ミリ秒、デフォルト: 1000）

#### stopContinuousMonitoring

```typescript
stopContinuousMonitoring(): void
```

継続的なメモリ監視を停止します。

#### getMemoryTrend

```typescript
getMemoryTrend(duration?: number): MemoryTrend
```

メモリ使用量の推移を取得します。

**パラメータ:**
- `duration?: number` - 期間（ミリ秒、デフォルト: 60000）

**戻り値:**
- `MemoryTrend` - メモリ推移情報

#### detectMemoryLeaks

```typescript
detectMemoryLeaks(): MemoryLeakReport
```

メモリリークを検出します。

**戻り値:**
- `MemoryLeakReport` - メモリリーク検出結果

#### getOptimizationSuggestions

```typescript
getOptimizationSuggestions(): MemoryOptimizationSuggestion[]
```

メモリ最適化の提案を取得します。

**戻り値:**
- `MemoryOptimizationSuggestion[]` - 最適化提案の配列

#### getAlerts

```typescript
getAlerts(severity?: 'info' | 'warning' | 'error'): MemoryAlert[]
```

メモリアラートを取得します。

**パラメータ:**
- `severity?: 'info' | 'warning' | 'error'` - アラートレベル

**戻り値:**
- `MemoryAlert[]` - アラートの配列

## EntityMonitor クラス

### メソッド

#### recordEntityCreation

```typescript
recordEntityCreation(entityId: EntityId): void
```

エンティティ作成を記録します。

**パラメータ:**
- `entityId: EntityId` - エンティティID

#### recordEntityDestruction

```typescript
recordEntityDestruction(entityId: EntityId): void
```

エンティティ削除を記録します。

**パラメータ:**
- `entityId: EntityId` - エンティティID

#### getEntityStats

```typescript
getEntityStats(): EntityLifecycleStats
```

エンティティライフサイクル統計を取得します。

**戻り値:**
- `EntityLifecycleStats` - ライフサイクル統計

#### analyzeCreationPatterns

```typescript
analyzeCreationPatterns(): EntityCreationAnalysis
```

エンティティ作成パターンを分析します。

**戻り値:**
- `EntityCreationAnalysis` - 作成パターン分析結果

#### analyzeMemoryEfficiency

```typescript
analyzeMemoryEfficiency(): MemoryEfficiencyAnalysis
```

メモリ効率を分析します。

**戻り値:**
- `MemoryEfficiencyAnalysis` - メモリ効率分析結果

#### analyzePerformanceImpact

```typescript
analyzePerformanceImpact(): PerformanceImpactAnalysis
```

パフォーマンス影響を分析します。

**戻り値:**
- `PerformanceImpactAnalysis` - パフォーマンス影響分析結果

## ReportGenerator クラス

### メソッド

#### generateComprehensiveReport

```typescript
generateComprehensiveReport(): PerformanceReport
```

総合パフォーマンスレポートを生成します。

**戻り値:**
- `PerformanceReport` - 総合レポート

#### generateHTMLReport

```typescript
generateHTMLReport(): string
```

HTML形式のレポートを生成します。

**戻り値:**
- `string` - HTMLレポート

#### generateJSONReport

```typescript
generateJSONReport(): string
```

JSON形式のレポートを生成します。

**戻り値:**
- `string` - JSONレポート

#### generateCSVReport

```typescript
generateCSVReport(): string
```

CSV形式のレポートを生成します。

**戻り値:**
- `string` - CSVレポート#
# 型定義

### PerformanceMonitorOptions

```typescript
interface PerformanceMonitorOptions {
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
```

### SystemMetrics

```typescript
interface SystemMetrics {
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
```

### SystemExecutionRecord

```typescript
interface SystemExecutionRecord {
  systemName: string;
  startTime: number;
  endTime: number;
  executionTime: number;
  processedEntities: number;
  memoryUsage: number;
  memoryDelta: number;
  timestamp: Date;
}
```

### SystemExecutionResult

```typescript
interface SystemExecutionResult {
  executionTime: number;
  memoryDelta: number;
  processedEntities: number;
  performanceScore: number;
}
```

### MemorySnapshot

```typescript
interface MemorySnapshot {
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
```

### MemoryTrend

```typescript
interface MemoryTrend {
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // bytes per second
  peakMemory: number;
  averageMemory: number;
  snapshots: MemorySnapshot[];
}
```

### MemoryLeakReport

```typescript
interface MemoryLeakReport {
  isLeaking: boolean;
  confidence: number;
  suspiciousPatterns: string[];
  recommendation: string[];
  trend: MemoryTrend;
}
```

### MemoryOptimizationSuggestion

```typescript
interface MemoryOptimizationSuggestion {
  type: 'entity-optimization' | 'component-optimization' | 'fragmentation-reduction';
  priority: 'high' | 'medium' | 'low';
  description: string;
  recommendation: string;
  estimatedSaving: number;
}
```

### EntityLifecycleStats

```typescript
interface EntityLifecycleStats {
  totalCreated: number;
  totalDestroyed: number;
  currentActive: number;
  peakActive: number;
  creationRate: number; // entities per second
  destructionRate: number; // entities per second
  averageLifespan: number; // milliseconds
}
```

### EntityCreationAnalysis

```typescript
interface EntityCreationAnalysis {
  pattern: 'steady' | 'bursty' | 'irregular' | 'insufficient-data';
  burstDetected: boolean;
  averageInterval: number;
  peakCreationRate: number;
  recommendations: string[];
}
```

### PerformanceReport

```typescript
interface PerformanceReport {
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
  alerts: any[];
}
```

## 使用例

### 基本的な監視

```typescript
// PerformanceMonitorの初期化
const performanceMonitor = new PerformanceMonitor(world, {
  enabled: true,
  metricsOptions: {
    maxHistorySize: 1000,
    enableDetailedMetrics: true
  },
  analysisOptions: {
    enableLeakDetection: true,
    enableBottleneckDetection: true
  }
});

// システム実行の監視
const systemMonitor = performanceMonitor.getSystemMonitor();
const token = systemMonitor.startSystemExecution('PhyllotaxisSystem');

// システム処理...

const result = systemMonitor.endSystemExecution(token, 25);
console.log(`System executed in ${result.executionTime}ms`);
```

### メモリ監視

```typescript
const memoryMonitor = performanceMonitor.getMemoryMonitor();

// 継続的監視開始
memoryMonitor.startContinuousMonitoring(1000);

// スナップショット取得
const snapshot = memoryMonitor.takeSnapshot();
console.log(`Memory usage: ${(snapshot.totalMemory / 1024 / 1024).toFixed(2)}MB`);

// メモリリーク検出
const leakReport = memoryMonitor.detectMemoryLeaks();
if (leakReport.isLeaking) {
  console.warn('Memory leak detected!');
  console.log('Recommendations:', leakReport.recommendation);
}

// 最適化提案
const suggestions = memoryMonitor.getOptimizationSuggestions();
suggestions.forEach(suggestion => {
  console.log(`${suggestion.priority}: ${suggestion.description}`);
});
```

### エンティティ監視

```typescript
const entityMonitor = performanceMonitor.getEntityMonitor();

// エンティティ作成パターン分析
const creationAnalysis = entityMonitor.analyzeCreationPatterns();
console.log(`Creation pattern: ${creationAnalysis.pattern}`);
if (creationAnalysis.burstDetected) {
  console.warn('Burst creation detected');
}

// メモリ効率分析
const memoryEfficiency = entityMonitor.analyzeMemoryEfficiency();
console.log(`Memory efficiency: ${memoryEfficiency.efficiency}%`);

// パフォーマンス影響分析
const performanceImpact = entityMonitor.analyzePerformanceImpact();
console.log(`Entity count: ${performanceImpact.entityCount}`);
console.log(`Predicted query time: ${performanceImpact.predictedQueryTime}ms`);
```

### レポート生成

```typescript
// 総合レポート生成
const report = performanceMonitor.generateReport();
console.log('Performance Summary:', report.summary);

// HTML レポート生成
const reportGenerator = new ReportGenerator(performanceMonitor);
const htmlReport = reportGenerator.generateHTMLReport();

// ファイルに保存
import fs from 'fs';
fs.writeFileSync('performance-report.html', htmlReport);

// JSON レポート生成
const jsonReport = reportGenerator.generateJSONReport();
fs.writeFileSync('performance-report.json', jsonReport);
```

### アラート監視

```typescript
// メモリアラート確認
const memoryAlerts = memoryMonitor.getAlerts('warning');
memoryAlerts.forEach(alert => {
  console.warn(`Memory Alert: ${alert.message}`);
});

// システムパフォーマンスアラート
const slowSystems = systemMonitor.getSlowSystems(10); // 10ms以上
slowSystems.forEach(system => {
  console.warn(`Slow system detected: ${system.systemName} (${system.averageExecutionTime}ms)`);
});
```

### 設定の動的変更

```typescript
// 監視設定の更新
performanceMonitor.updateSettings({
  analysisOptions: {
    performanceThresholds: {
      slowSystemThreshold: 5.0,
      highMemoryThreshold: 50 * 1024 * 1024, // 50MB
      highEntityCountThreshold: 100
    }
  },
  alertOptions: {
    alertThresholds: {
      systemExecutionTime: 10.0,
      memoryUsage: 100 * 1024 * 1024, // 100MB
      entityCreationRate: 10.0 // 10 entities/sec
    }
  }
});
```

## 関連文書

> [!info] 設計文書
> - [[../architecture/ecs/performance-monitor|PerformanceMonitor設計]]
> - [[../architecture/ecs/world|World設計]]

> [!note] 関連API
> - [[ecs-query-system|QuerySystem API]]
> - [[world-integration|World統合 API]]
> - [[react-integration|React統合 API]]