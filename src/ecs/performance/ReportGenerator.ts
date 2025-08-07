/**
 * ReportGenerator - パフォーマンスレポート生成クラス
 */

import type { PerformanceMonitor } from './PerformanceMonitor';
import type { PerformanceReport } from './types';

/**
 * ReportGenerator
 * 
 * PerformanceMonitorの各監視コンポーネントからデータを収集し、
 * 総合的なパフォーマンスレポートを生成します。
 * HTML、JSON、CSV形式での出力をサポートします。
 */
export class ReportGenerator {
  private performanceMonitor: PerformanceMonitor;

  constructor(performanceMonitor: PerformanceMonitor) {
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * 総合パフォーマンスレポートを生成
   */
  generateComprehensiveReport(): PerformanceReport {
    const timestamp = new Date();
    const systemMonitor = this.performanceMonitor.getSystemMonitor();
    const memoryMonitor = this.performanceMonitor.getMemoryMonitor();
    const entityMonitor = this.performanceMonitor.getEntityMonitor();

    // システムパフォーマンス分析
    const systemsSummary = systemMonitor.getSystemsSummary();
    const allSystemMetrics = systemMonitor.getSystemMetrics();
    const slowestSystems = allSystemMetrics
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, 3);
    const fastestSystems = allSystemMetrics
      .sort((a, b) => a.averageExecutionTime - b.averageExecutionTime)
      .slice(0, 3);

    // メモリ分析
    const memoryTrend = memoryMonitor.getMemoryTrend();
    const leakDetection = memoryMonitor.detectMemoryLeaks();

    // エンティティ分析
    const entityStats = entityMonitor.getEntityStats();

    // 推奨事項の収集
    const recommendations = this.collectRecommendations();

    // アラートの収集
    const alerts = memoryMonitor.getAlerts();

    // サマリー生成
    const summary = this.generateSummary(systemsSummary, memoryTrend, entityStats);

    return {
      timestamp,
      summary,
      systemPerformance: {
        totalSystems: systemsSummary.totalSystems,
        averagePerformanceScore: systemsSummary.averagePerformanceScore,
        slowestSystems,
        fastestSystems
      },
      memoryAnalysis: {
        currentTrend: memoryTrend.trend,
        changeRate: memoryTrend.changeRate,
        peakMemory: memoryTrend.peakMemory,
        leakDetection
      },
      entityAnalysis: {
        activeEntities: entityStats.currentActive,
        creationRate: entityStats.creationRate,
        destructionRate: entityStats.destructionRate,
        averageLifespan: entityStats.averageLifespan
      },
      recommendations,
      alerts
    };
  }

  /**
   * HTML形式のレポートを生成
   */
  generateHTMLReport(): string {
    const report = this.generateComprehensiveReport();
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${report.timestamp.toISOString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007acc; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #007acc; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; font-size: 14px; }
        .alert { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .recommendations { background: #e8f5e8; padding: 15px; border-radius: 6px; border-left: 4px solid #28a745; }
        .system-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .system-table th, .system-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .system-table th { background: #f8f9fa; font-weight: bold; }
        .trend-increasing { color: #dc3545; }
        .trend-decreasing { color: #28a745; }
        .trend-stable { color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Performance Monitor Report</h1>
            <p>Generated: ${report.timestamp.toLocaleString()}</p>
            <p class="summary">${report.summary}</p>
        </div>

        <div class="section">
            <h2>📊 System Performance</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${report.systemPerformance.totalSystems}</div>
                    <div class="metric-label">Total Systems</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.systemPerformance.averagePerformanceScore.toFixed(1)}</div>
                    <div class="metric-label">Average Performance Score</div>
                </div>
            </div>
            
            ${this.generateSystemTable('Slowest Systems', report.systemPerformance.slowestSystems)}
            ${this.generateSystemTable('Fastest Systems', report.systemPerformance.fastestSystems)}
        </div>

        <div class="section">
            <h2>💾 Memory Analysis</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value trend-${report.memoryAnalysis.currentTrend}">${report.memoryAnalysis.currentTrend}</div>
                    <div class="metric-label">Memory Trend</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(report.memoryAnalysis.changeRate / 1024).toFixed(2)} KB/s</div>
                    <div class="metric-label">Change Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(report.memoryAnalysis.peakMemory / 1024 / 1024).toFixed(2)} MB</div>
                    <div class="metric-label">Peak Memory</div>
                </div>
            </div>
            
            ${report.memoryAnalysis.leakDetection.isLeaking ? 
              `<div class="alert alert-error">
                 <strong>⚠️ Memory Leak Detected!</strong> 
                 Confidence: ${(report.memoryAnalysis.leakDetection.confidence * 100).toFixed(1)}%
               </div>` : 
              '<div class="alert alert-info">✅ No memory leaks detected</div>'
            }
        </div>

        <div class="section">
            <h2>🏗️ Entity Analysis</h2>
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-value">${report.entityAnalysis.activeEntities}</div>
                    <div class="metric-label">Active Entities</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.entityAnalysis.creationRate.toFixed(2)}/s</div>
                    <div class="metric-label">Creation Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${report.entityAnalysis.destructionRate.toFixed(2)}/s</div>
                    <div class="metric-label">Destruction Rate</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${(report.entityAnalysis.averageLifespan / 1000).toFixed(2)}s</div>
                    <div class="metric-label">Average Lifespan</div>
                </div>
            </div>
        </div>

        ${report.alerts.length > 0 ? `
        <div class="section">
            <h2>🚨 Alerts</h2>
            ${report.alerts.map(alert => `
                <div class="alert alert-${alert.severity}">
                    <strong>${alert.type}:</strong> ${alert.message}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="section">
            <h2>💡 Recommendations</h2>
            <div class="recommendations">
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * JSON形式のレポートを生成
   */
  generateJSONReport(): string {
    const report = this.generateComprehensiveReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * CSV形式のレポートを生成
   */
  generateCSVReport(): string {
    const report = this.generateComprehensiveReport();
    
    const csvLines: string[] = [];
    
    // ヘッダー
    csvLines.push('Metric,Value,Unit,Timestamp');
    
    // システムメトリクス
    csvLines.push(`Total Systems,${report.systemPerformance.totalSystems},count,${report.timestamp.toISOString()}`);
    csvLines.push(`Average Performance Score,${report.systemPerformance.averagePerformanceScore.toFixed(2)},score,${report.timestamp.toISOString()}`);
    
    // メモリメトリクス
    csvLines.push(`Memory Trend,${report.memoryAnalysis.currentTrend},trend,${report.timestamp.toISOString()}`);
    csvLines.push(`Memory Change Rate,${report.memoryAnalysis.changeRate.toFixed(2)},bytes/sec,${report.timestamp.toISOString()}`);
    csvLines.push(`Peak Memory,${report.memoryAnalysis.peakMemory},bytes,${report.timestamp.toISOString()}`);
    
    // エンティティメトリクス
    csvLines.push(`Active Entities,${report.entityAnalysis.activeEntities},count,${report.timestamp.toISOString()}`);
    csvLines.push(`Entity Creation Rate,${report.entityAnalysis.creationRate.toFixed(2)},entities/sec,${report.timestamp.toISOString()}`);
    csvLines.push(`Entity Destruction Rate,${report.entityAnalysis.destructionRate.toFixed(2)},entities/sec,${report.timestamp.toISOString()}`);
    csvLines.push(`Average Entity Lifespan,${report.entityAnalysis.averageLifespan.toFixed(2)},milliseconds,${report.timestamp.toISOString()}`);
    
    return csvLines.join('\n');
  }

  /**
   * プライベートメソッド群
   */
  private collectRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const systemMonitor = this.performanceMonitor.getSystemMonitor();
    const memoryMonitor = this.performanceMonitor.getMemoryMonitor();
    const entityMonitor = this.performanceMonitor.getEntityMonitor();

    // システム推奨事項
    const slowSystems = systemMonitor.getSlowSystems(5.0);
    if (slowSystems.length > 0) {
      recommendations.push(`Optimize slow systems: ${slowSystems.map(s => s.systemName).join(', ')}`);
    }

    // メモリ推奨事項
    const memoryOptimizations = memoryMonitor.getOptimizationSuggestions();
    memoryOptimizations.forEach(opt => {
      recommendations.push(opt.recommendation);
    });

    // エンティティ推奨事項
    const creationAnalysis = entityMonitor.analyzeCreationPatterns();
    recommendations.push(...creationAnalysis.recommendations);

    const memoryEfficiency = entityMonitor.analyzeMemoryEfficiency();
    recommendations.push(...memoryEfficiency.recommendations);

    const performanceImpact = entityMonitor.analyzePerformanceImpact();
    recommendations.push(...performanceImpact.recommendations);

    return recommendations.length > 0 ? recommendations : ['System performance is optimal'];
  }

  private generateSummary(
    systemsSummary: { averagePerformanceScore: number },
    memoryTrend: { trend: string },
    entityStats: { currentActive: number }
  ): string {
    const parts: string[] = [];

    // システム状況
    if (systemsSummary.averagePerformanceScore > 80) {
      parts.push('System performance is good');
    } else if (systemsSummary.averagePerformanceScore > 60) {
      parts.push('System performance needs attention');
    } else {
      parts.push('System performance is poor');
    }

    // メモリ状況
    if (memoryTrend.trend === 'increasing') {
      parts.push('memory usage is increasing');
    } else if (memoryTrend.trend === 'decreasing') {
      parts.push('memory usage is decreasing');
    } else {
      parts.push('memory usage is stable');
    }

    // エンティティ状況
    if (entityStats.currentActive > 50) {
      parts.push(`managing ${entityStats.currentActive} entities`);
    } else {
      parts.push(`managing ${entityStats.currentActive} entities (low load)`);
    }

    return parts.join(', ') + '.';
  }

  private generateSystemTable(title: string, systems: Array<{
    systemName: string;
    averageExecutionTime: number;
    totalExecutions: number;
    performanceScore: number;
  }>): string {
    if (systems.length === 0) return '';

    return `
      <h3>${title}</h3>
      <table class="system-table">
        <thead>
          <tr>
            <th>System Name</th>
            <th>Avg Execution Time</th>
            <th>Total Executions</th>
            <th>Performance Score</th>
          </tr>
        </thead>
        <tbody>
          ${systems.map(system => `
            <tr>
              <td>${system.systemName}</td>
              <td>${system.averageExecutionTime.toFixed(2)}ms</td>
              <td>${system.totalExecutions}</td>
              <td>${system.performanceScore.toFixed(1)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}