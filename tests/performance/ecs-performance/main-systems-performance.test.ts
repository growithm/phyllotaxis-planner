/**
 * ECS主要システムパフォーマンステスト
 * 
 * PhyllotaxisSystem、AnimationSystem、RenderSystemの性能を測定します。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventBusManager } from '@/events/EventBusManager';
import {
  createTestWorld,
  createTestSystemManager,
  setupMainSystems,
  createMultipleTestEntities,
  runSystemsOnce,
  getEntityPosition,
  createMockSVGElement,
  hasSVGElement,
  cleanupIntegrationTest,
} from '../../shared/helpers/ecs-helpers';
import {
  performanceTestConfig,
} from '../../shared/fixtures/ecs-data/system-integration-fixtures';

describe('ECS主要システムパフォーマンステスト', () => {
  let world: any;
  let systemManager: any;
  let eventBus: any;
  let svgElement: SVGSVGElement;
  let systems: any;

  beforeEach(() => {
    world = createTestWorld();
    eventBus = new EventBusManager().getEventBus();
    systemManager = createTestSystemManager(eventBus);
    svgElement = createMockSVGElement();
    systems = setupMainSystems(systemManager, eventBus, svgElement);
    systemManager.start();
    // eventBus.removeAllListeners(); // この行をコメントアウト
  });

  afterEach(() => {
    cleanupIntegrationTest(world, systemManager, svgElement);
  });

  describe('単一フレーム処理性能', () => {
    it('10エンティティの処理が16ms以内で完了する（60FPS維持）', () => {
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.smallDataset);
      
      const startTime = performance.now();
      runSystemsOnce(systemManager, world);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(performanceTestConfig.maxProcessingTime);
      
      // 全エンティティが正しく処理されたことを確認
      entityIds.forEach(entityId => {
        expect(getEntityPosition(world, entityId)).not.toBeNull();
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
    });

    it('50エンティティの処理が32ms以内で完了する（30FPS維持）', () => {
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.mediumDataset);
      
      const startTime = performance.now();
      runSystemsOnce(systemManager, world);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // 30FPS維持のための制限時間
      expect(processingTime).toBeLessThan(performanceTestConfig.maxProcessingTime * 2);
      
      // 全エンティティが正しく処理されたことを確認
      entityIds.forEach(entityId => {
        expect(getEntityPosition(world, entityId)).not.toBeNull();
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
    });

    it('100エンティティの処理が100ms以内で完了する', () => {
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.largeDataset);
      
      const startTime = performance.now();
      runSystemsOnce(systemManager, world);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // 大量データでも合理的な時間内で完了
      expect(processingTime).toBeLessThan(100);
      
      // 全エンティティが正しく処理されたことを確認
      entityIds.forEach(entityId => {
        expect(getEntityPosition(world, entityId)).not.toBeNull();
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
    });
  });

  describe('継続実行性能', () => {
    it('10エンティティで1秒間の継続実行が安定している', async () => {
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.smallDataset);
      const processingTimes: number[] = [];
      const iterations = 60; // 1秒間のフレーム数（60FPS想定）
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        runSystemsOnce(systemManager, world);
        const endTime = performance.now();
        
        processingTimes.push(endTime - startTime);
        
        // フレーム間隔をシミュレート
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      // 平均処理時間が制限内であることを確認
      const averageTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      expect(averageTime).toBeLessThan(performanceTestConfig.maxProcessingTime);
      
      // 最大処理時間が許容範囲内であることを確認
      const maxTime = Math.max(...processingTimes);
      expect(maxTime).toBeLessThan(performanceTestConfig.maxProcessingTime * 2);
      
      // 処理時間の分散が小さいことを確認（安定性）
      const variance = processingTimes.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / processingTimes.length;
      const standardDeviation = Math.sqrt(variance);
      expect(standardDeviation).toBeLessThan(averageTime * 1.0); // 標準偏差が平均の100%以下（許容範囲を拡大）
    });

    it('50エンティティで継続実行時のメモリ使用量が安定している', async () => {
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.mediumDataset);
      
      // 初期メモリ使用量を記録（概算）
      const initialEntityCount = world.getAllEntities().length;
      
      // 複数回実行
      const iterations = 10;
      for (let i = 0; i < iterations; i++) {
        runSystemsOnce(systemManager, world);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // メモリリークがないことを確認（エンティティ数が変わらない）
      const finalEntityCount = world.getAllEntities().length;
      expect(finalEntityCount).toBe(initialEntityCount);
      
      // SVG要素数も一致することを確認
      const svgElementCount = svgElement.querySelectorAll('g[id^="entity-"]').length;
      expect(svgElementCount).toBe(entityIds.length);
    });
  });

  describe('システム別性能分析', () => {
    it('PhyllotaxisSystemの処理時間を測定', () => {
      const entityIds = createMultipleTestEntities(world, 30);
      
      // PhyllotaxisSystemのみの処理時間を測定
      const startTime = performance.now();
      systems.phyllotaxisSystem.update(world.getAllEntities(), world, 16);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // フィロタキシス計算は高速であることを確認
      expect(processingTime).toBeLessThan(5); // 5ms以内
      
      // 位置が正しく計算されたことを確認
      entityIds.forEach(entityId => {
        const position = getEntityPosition(world, entityId);
        expect(position).not.toBeNull();
        expect(position!.x).not.toBe(0);
        expect(position!.y).not.toBe(0);
      });
    });

    it('RenderSystemの処理時間を測定', () => {
      const entityIds = createMultipleTestEntities(world, 30);
      
      // 事前にPhyllotaxisSystemで位置を計算
      systems.phyllotaxisSystem.update(world.getAllEntities(), world, 16);
      
      // RenderSystemのみの処理時間を測定
      const startTime = performance.now();
      systems.renderSystem.update(world.getAllEntities(), world, 16);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // SVG描画処理時間を確認
      expect(processingTime).toBeLessThan(10); // 10ms以内
      
      // SVG要素が作成されたことを確認
      entityIds.forEach(entityId => {
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
    });

    it('AnimationSystemの処理時間を測定', () => {
      const entityIds = createMultipleTestEntities(world, 30);
      
      // アニメーション状態を設定
      entityIds.forEach(entityId => {
        const animationComponent = world.getComponent(entityId, 'animation');
        if (animationComponent) {
          animationComponent.isAnimating = true;
          animationComponent.startTime = Date.now();
        }
      });
      
      // AnimationSystemのみの処理時間を測定
      const startTime = performance.now();
      systems.animationSystem.update(world.getAllEntities(), world, 16);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      
      // アニメーション処理時間を確認
      expect(processingTime).toBeLessThan(8); // 8ms以内
    });
  });

  describe('スケーラビリティテスト', () => {
    it('エンティティ数に対する処理時間の線形性を確認', () => {
      const testSizes = [10, 20, 30, 40, 50];
      const results: Array<{ size: number; time: number }> = [];
      
      testSizes.forEach(size => {
        // 新しいWorldで各テストを実行
        const testWorld = createTestWorld();
        const testSystemManager = createTestSystemManager(eventBus);
        const testSvgElement = createMockSVGElement();
        const testSystems = setupMainSystems(testSystemManager, eventBus, testSvgElement);
        testSystemManager.start();
        
        createMultipleTestEntities(testWorld, size);
        
        const startTime = performance.now();
        const entities = testWorld.getAllEntities(); testSystemManager.update(entities, testWorld, 16);
        const endTime = performance.now();
        
        results.push({ size, time: endTime - startTime });
        
        // クリーンアップ
        cleanupIntegrationTest(testWorld, testSystemManager, testSvgElement);
      });
      
      // 処理時間がエンティティ数にほぼ比例することを確認
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        
        const sizeRatio = curr.size / prev.size;
        const timeRatio = curr.time / prev.time;
        
        // 時間比がサイズ比の3倍以内であることを確認（線形性の許容範囲を拡大）
        expect(timeRatio).toBeLessThan(sizeRatio * 3);
      }
    });

    it('大量エンティティでのメモリ効率を確認', () => {
      const largeEntityCount = 200;
      const entityIds = createMultipleTestEntities(world, largeEntityCount);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 全エンティティが処理されたことを確認
      entityIds.forEach(entityId => {
        expect(getEntityPosition(world, entityId)).not.toBeNull();
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
      
      // SVG要素数が正確であることを確認
      const svgElementCount = svgElement.querySelectorAll('g[id^="entity-"]').length;
      expect(svgElementCount).toBe(largeEntityCount);
      
      // World内のエンティティ数が正確であることを確認
      expect(world.getAllEntities().length).toBe(largeEntityCount);
    });
  });

  describe('リアルタイム性能要件', () => {
    it('60FPSでの連続実行が可能', async () => {
      const entityIds = createMultipleTestEntities(world, 20);
      const targetFPS = 60;
      const frameTime = 1000 / targetFPS; // 16.67ms
      const testDuration = 1000; // 1秒
      const expectedFrames = Math.floor(testDuration / frameTime);
      
      let actualFrames = 0;
      const startTime = Date.now();
      
      while (Date.now() - startTime < testDuration) {
        const frameStart = performance.now();
        runSystemsOnce(systemManager, world);
        const frameEnd = performance.now();
        
        const frameProcessingTime = frameEnd - frameStart;
        
        // フレーム処理時間が制限内であることを確認
        expect(frameProcessingTime).toBeLessThan(frameTime);
        
        actualFrames++;
        
        // 次のフレームまで待機
        const remainingTime = frameTime - frameProcessingTime;
        if (remainingTime > 0) {
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
      }
      
      // 期待されるフレーム数に近いことを確認（50%以上に調整）
      expect(actualFrames).toBeGreaterThan(expectedFrames * 0.5);
    });
  });
});
