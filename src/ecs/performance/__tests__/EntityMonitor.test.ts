/**
 * EntityMonitor単体テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EntityMonitor } from '../EntityMonitor';
import { World } from '@/ecs/core/World';
import { EventBusImpl } from '@/events/core/EventBusImpl';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent } from '@/ecs/components/PositionComponent';
import { createTextComponent } from '@/ecs/components/TextComponent';

describe('EntityMonitor', () => {
  let world: World;
  let entityMonitor: EntityMonitor;

  beforeEach(() => {
    const eventBus = new EventBusImpl();
    world = new World(eventBus);
    entityMonitor = new EntityMonitor(world);
  });

  afterEach(() => {
    world.clear();
  });

  describe('エンティティライフサイクル監視', () => {
    it('エンティティ作成が正しく記録される', () => {
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      
      const stats = entityMonitor.getEntityStats();
      
      expect(stats.totalCreated).toBe(1);
      expect(stats.currentActive).toBe(1);
      expect(stats.peakActive).toBe(1);
      expect(stats.totalDestroyed).toBe(0);
    });

    it('エンティティ削除が正しく記録される', () => {
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      
      // 少し待機してライフスパンを作る
      const startTime = Date.now();
      while (Date.now() - startTime < 5) {
        // 5ms待機
      }
      
      world.destroyEntity(entityId);
      entityMonitor.recordEntityDestruction(entityId);
      
      const stats = entityMonitor.getEntityStats();
      
      expect(stats.totalCreated).toBe(1);
      expect(stats.totalDestroyed).toBe(1);
      expect(stats.currentActive).toBe(0);
      expect(stats.averageLifespan).toBeGreaterThan(0);
    });

    it('複数エンティティのライフサイクルが正しく管理される', () => {
      const entityIds = [];
      
      // 5個のエンティティを作成
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        entityIds.push(entityId);
        entityMonitor.recordEntityCreation(entityId);
      }
      
      // 2個のエンティティを削除
      for (let i = 0; i < 2; i++) {
        world.destroyEntity(entityIds[i]);
        entityMonitor.recordEntityDestruction(entityIds[i]);
      }
      
      const stats = entityMonitor.getEntityStats();
      
      expect(stats.totalCreated).toBe(5);
      expect(stats.totalDestroyed).toBe(2);
      expect(stats.currentActive).toBe(3);
      expect(stats.peakActive).toBe(5);
    });

    it('作成・削除レートが計算される', () => {
      // 複数のエンティティを短時間で作成
      for (let i = 0; i < 3; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
      }
      
      const stats = entityMonitor.getEntityStats();
      expect(stats.creationRate).toBeGreaterThanOrEqual(0);
      
      // エンティティを削除
      const entityIds = world.getAllEntities();
      entityIds.forEach(entityId => {
        world.destroyEntity(entityId);
        entityMonitor.recordEntityDestruction(entityId);
      });
      
      const updatedStats = entityMonitor.getEntityStats();
      expect(updatedStats.destructionRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('コンポーネント使用統計', () => {
    it('コンポーネント追加が記録される', () => {
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.TEXT, 'add');
      
      const positionStats = entityMonitor.getComponentUsageStats(ComponentTypes.POSITION);
      const textStats = entityMonitor.getComponentUsageStats(ComponentTypes.TEXT);
      
      expect(positionStats).toHaveLength(1);
      expect(positionStats[0].totalAdded).toBe(2);
      expect(positionStats[0].currentCount).toBe(2);
      expect(positionStats[0].peakCount).toBe(2);
      
      expect(textStats).toHaveLength(1);
      expect(textStats[0].totalAdded).toBe(1);
      expect(textStats[0].currentCount).toBe(1);
    });

    it('コンポーネント削除が記録される', () => {
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'remove');
      
      const stats = entityMonitor.getComponentUsageStats(ComponentTypes.POSITION);
      
      expect(stats[0].totalAdded).toBe(2);
      expect(stats[0].totalRemoved).toBe(1);
      expect(stats[0].currentCount).toBe(1);
      expect(stats[0].peakCount).toBe(2);
    });

    it('全コンポーネント統計が取得される', () => {
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.TEXT, 'add');
      entityMonitor.recordComponentUsage(ComponentTypes.VISUAL, 'add');
      
      const allStats = entityMonitor.getComponentUsageStats();
      
      expect(allStats).toHaveLength(3);
      expect(allStats.map(s => s.componentType)).toContain(ComponentTypes.POSITION);
      expect(allStats.map(s => s.componentType)).toContain(ComponentTypes.TEXT);
      expect(allStats.map(s => s.componentType)).toContain(ComponentTypes.VISUAL);
    });
  });

  describe('エンティティ作成パターン分析', () => {
    it('データ不足時の分析結果', () => {
      const analysis = entityMonitor.analyzeCreationPatterns();
      
      expect(analysis.pattern).toBe('insufficient-data');
      expect(analysis.burstDetected).toBe(false);
      expect(analysis.averageInterval).toBe(0);
      expect(analysis.peakCreationRate).toBe(0);
      expect(analysis.recommendations).toContain('Insufficient data for pattern analysis');
    });

    it('定期的な作成パターンの検出', () => {
      // 定期的な間隔でエンティティを作成
      for (let i = 0; i < 10; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
        
        // 一定間隔で待機（同期的）
        const startTime = Date.now();
        while (Date.now() - startTime < 2) {
          // 2ms待機
        }
      }
      
      const analysis = entityMonitor.analyzeCreationPatterns();
      
      expect(analysis.pattern).toMatch(/^(steady|bursty|irregular)$/);
      expect(analysis.averageInterval).toBeGreaterThan(0);
      expect(analysis.peakCreationRate).toBeGreaterThan(0);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('バースト作成パターンの検出', () => {
      // バースト的にエンティティを作成（短時間に集中）
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
      }
      
      // 長い間隔
      const startTime = Date.now();
      while (Date.now() - startTime < 20) {
        // 20ms待機
      }
      
      // 再びバースト
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        entityMonitor.recordEntityCreation(entityId);
      }
      
      const analysis = entityMonitor.analyzeCreationPatterns();
      
      expect(analysis.pattern).toMatch(/^(bursty|irregular)$/);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('メモリ効率分析', () => {
    it('メモリ効率分析が実行される', () => {
      // エンティティとコンポーネントを作成
      const entityId1 = world.createEntity();
      const entityId2 = world.createEntity();
      world.addComponent(entityId1, createPositionComponent(0, 0));
      world.addComponent(entityId1, createTextComponent('test1', 'idea'));
      world.addComponent(entityId2, createPositionComponent(1, 1));
      
      const analysis = entityMonitor.analyzeMemoryEfficiency();
      
      expect(analysis.totalMemoryUsage).toBeGreaterThan(0);
      expect(analysis.averageMemoryPerEntity).toBeGreaterThan(0);
      expect(typeof analysis.componentMemoryBreakdown).toBe('object');
      expect(analysis.efficiency).toBeGreaterThanOrEqual(0);
      expect(analysis.efficiency).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('高メモリ使用量の検出', () => {
      // エンティティメモリ推定をモック
      const originalEstimateEntityMemory = entityMonitor['estimateEntityMemory'];
      entityMonitor['estimateEntityMemory'] = vi.fn(() => 2048); // 2KB per entity
      
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      
      const analysis = entityMonitor.analyzeMemoryEfficiency();
      
      expect(analysis.efficiency).toBeLessThan(100);
      expect(analysis.recommendations.some(rec => 
        rec.includes('High memory usage') || rec.includes('optimizing')
      )).toBe(true);
      
      // モックを復元
      entityMonitor['estimateEntityMemory'] = originalEstimateEntityMemory;
    });
  });

  describe('パフォーマンス影響分析', () => {
    it('パフォーマンス影響分析が実行される', () => {
      // 複数のエンティティとコンポーネントを作成
      for (let i = 0; i < 5; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createPositionComponent(i, i));
        world.addComponent(entityId, createTextComponent(`entity-${i}`, 'idea'));
      }
      
      const analysis = entityMonitor.analyzePerformanceImpact();
      
      expect(analysis.entityCount).toBe(5);
      expect(analysis.componentCount).toBe(10); // 5 entities * 2 components
      expect(analysis.entityDensity).toBe(2); // 10 components / 5 entities
      expect(analysis.predictedQueryTime).toBeGreaterThan(0);
      expect(analysis.predictedUpdateTime).toBeGreaterThan(0);
      expect(Array.isArray(analysis.bottlenecks)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

    it('高エンティティ数のボトルネック検出', () => {
      // 大量のエンティティを作成
      for (let i = 0; i < 150; i++) {
        const entityId = world.createEntity();
        world.addComponent(entityId, createPositionComponent(i, i));
      }
      
      const analysis = entityMonitor.analyzePerformanceImpact();
      
      expect(analysis.entityCount).toBe(150);
      expect(analysis.bottlenecks.some(bottleneck => 
        bottleneck.includes('entity count')
      )).toBe(true);
      expect(analysis.recommendations.some(rec => 
        rec.includes('entity culling') || rec.includes('spatial partitioning')
      )).toBe(true);
    });

    it('高コンポーネント数のボトルネック検出', () => {
      // コンポーネント統計をモック
      const originalGetComponentStats = entityMonitor['getComponentStats'];
      entityMonitor['getComponentStats'] = vi.fn(() => ({
        [ComponentTypes.POSITION]: 60,
        [ComponentTypes.TEXT]: 40,
        [ComponentTypes.VISUAL]: 30
      }));
      
      const analysis = entityMonitor.analyzePerformanceImpact();
      
      expect(analysis.bottlenecks.some(bottleneck => 
        bottleneck.includes('component count')
      )).toBe(true);
      expect(analysis.recommendations.some(rec => 
        rec.includes('component pooling') || rec.includes('archetype optimization')
      )).toBe(true);
      
      // モックを復元
      entityMonitor['getComponentStats'] = originalGetComponentStats;
    });
  });

  describe('統計リセット', () => {
    it('統計リセットが正常に動作する', () => {
      // データを生成
      const entityId = world.createEntity();
      entityMonitor.recordEntityCreation(entityId);
      entityMonitor.recordComponentUsage(ComponentTypes.POSITION, 'add');
      
      // リセット前の確認
      expect(entityMonitor.getEntityStats().totalCreated).toBe(1);
      expect(entityMonitor.getComponentUsageStats()).toHaveLength(1);
      
      // リセット実行
      entityMonitor.resetStats();
      
      // リセット後の確認
      const stats = entityMonitor.getEntityStats();
      expect(stats.totalCreated).toBe(0);
      expect(stats.totalDestroyed).toBe(0);
      expect(stats.currentActive).toBe(0);
      expect(stats.peakActive).toBe(0);
      expect(entityMonitor.getComponentUsageStats()).toHaveLength(0);
    });
  });

  describe('ヘルパーメソッド', () => {
    it('エンティティコンポーネント数が正しく取得される', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test', 'idea'));
      
      const componentCount = entityMonitor['getEntityComponentCount'](entityId);
      expect(componentCount).toBe(2);
    });

    it('エンティティメモリ推定が動作する', () => {
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test', 'idea'));
      
      const estimatedMemory = entityMonitor['estimateEntityMemory'](entityId);
      expect(estimatedMemory).toBeGreaterThan(0);
      expect(estimatedMemory).toBe(64 + (2 * 256)); // 基本64B + 2コンポーネント * 256B
    });

    it('分散計算が正しく動作する', () => {
      const values = [1, 2, 3, 4, 5];
      const variance = entityMonitor['calculateVariance'](values);
      
      // 分散 = ((1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)²) / 5 = (4+1+0+1+4) / 5 = 2
      expect(variance).toBeCloseTo(2, 1);
    });

    it('空配列の分散計算', () => {
      const variance = entityMonitor['calculateVariance']([]);
      expect(variance).toBe(0);
    });

    it('パフォーマンス予測が動作する', () => {
      const queryTime = entityMonitor['predictQueryPerformance'](50, 2.5);
      const updateTime = entityMonitor['predictUpdatePerformance'](50, 2.5);
      
      expect(queryTime).toBeGreaterThan(0);
      expect(updateTime).toBeGreaterThan(0);
      expect(updateTime).toBeGreaterThan(queryTime); // 更新の方が時間がかかる
    });
  });

  describe('推奨事項生成', () => {
    it('作成パターンに基づく推奨事項が生成される', () => {
      const burstRecommendations = entityMonitor['generateCreationRecommendations']('bursty', true);
      const steadyRecommendations = entityMonitor['generateCreationRecommendations']('steady', false);
      const irregularRecommendations = entityMonitor['generateCreationRecommendations']('irregular', false);
      
      expect(burstRecommendations.some(rec => rec.includes('pooling'))).toBe(true);
      expect(burstRecommendations.some(rec => rec.includes('rate limiting'))).toBe(true);
      
      expect(steadyRecommendations.some(rec => rec.includes('optimal'))).toBe(true);
      
      expect(irregularRecommendations.some(rec => rec.includes('triggers'))).toBe(true);
    });

    it('メモリ効率に基づく推奨事項が生成される', () => {
      const lowEfficiencyRecs = entityMonitor['generateMemoryEfficiencyRecommendations'](30);
      const mediumEfficiencyRecs = entityMonitor['generateMemoryEfficiencyRecommendations'](60);
      const highEfficiencyRecs = entityMonitor['generateMemoryEfficiencyRecommendations'](90);
      
      expect(lowEfficiencyRecs.some(rec => rec.includes('High memory usage'))).toBe(true);
      expect(mediumEfficiencyRecs.some(rec => rec.includes('minor optimizations'))).toBe(true);
      expect(highEfficiencyRecs.some(rec => rec.includes('efficient'))).toBe(true);
    });

    it('パフォーマンスボトルネックに基づく推奨事項が生成される', () => {
      const entityBottlenecks = ['High entity count may impact query performance'];
      const componentBottlenecks = ['High component count detected for some types'];
      const noBottlenecks: string[] = [];
      
      const entityRecs = entityMonitor['generatePerformanceRecommendations'](entityBottlenecks);
      const componentRecs = entityMonitor['generatePerformanceRecommendations'](componentBottlenecks);
      const noBottleneckRecs = entityMonitor['generatePerformanceRecommendations'](noBottlenecks);
      
      expect(entityRecs.some(rec => rec.includes('culling') || rec.includes('spatial'))).toBe(true);
      expect(componentRecs.some(rec => rec.includes('pooling') || rec.includes('archetype'))).toBe(true);
      expect(noBottleneckRecs.some(rec => rec.includes('acceptable'))).toBe(true);
    });
  });
});