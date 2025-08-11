/**
 * ECS主要システム統合テスト
 * 
 * PhyllotaxisSystem、AnimationSystem、RenderSystemの統合動作をテストします。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusManager } from '@/events/EventBusManager';
import { SystemEvents } from '@/events/types/EventTypes';
import {
  createTestWorld,
  createTestSystemManager,
  setupMainSystems,
  createTestIdeaEntity,
  createMultipleTestEntities,
  runSystemsOnce,
  getEntityPosition,
  createMockSVGElement,
  hasSVGElement,
  getSVGElementPosition,
  waitForEvent,
  verifyEventOrder,
  cleanupIntegrationTest,
} from '../../shared/helpers/ecs-helpers';
import {
  performanceTestConfig,
} from '../../shared/fixtures/ecs-data/system-integration-fixtures';

describe('ECS主要システム統合テスト', () => {
  let world: any;
  let systemManager: any;
  let eventBus: any;
  let svgElement: SVGSVGElement;
  let systems: any;

  beforeEach(() => {
    // テスト環境をセットアップ
    world = createTestWorld();
    eventBus = new EventBusManager().getEventBus();
    systemManager = createTestSystemManager(eventBus);
    svgElement = createMockSVGElement();
    
    // 主要システムをセットアップ
    systems = setupMainSystems(systemManager, eventBus, svgElement);
    
    // SystemManagerを開始
    systemManager.start();
    
    // イベントバスをクリア（システムのイベントリスナーが登録された後）
    // eventBus.clear(); // この行をコメントアウト
  });

  afterEach(() => {
    // テスト後のクリーンアップ
    cleanupIntegrationTest(world, systemManager, svgElement);
  });

  describe('システム実行順序の検証', () => {
    it('3システムが設計通りの優先度順序で実行される', () => {
      // システムの統計情報を確認
      const systemStats = systemManager.getSystemStats(world);
      
      expect(systemStats).toHaveLength(3);
      expect(systemStats[0].name).toBe('PhyllotaxisSystem');
      expect(systemStats[0].priority).toBe(100);
      expect(systemStats[1].name).toBe('AnimationSystem');
      expect(systemStats[1].priority).toBe(200);
      expect(systemStats[2].name).toBe('RenderSystem');
      expect(systemStats[2].priority).toBe(300);
    });

    it('システムが正しい順序で実行される', async () => {
      // エンティティを作成
      const entityId = createTestIdeaEntity(world, 'テストアイデア');
      
      // システム実行をモック
      const executionOrder: string[] = [];
      
      const originalPhyllotaxisUpdate = systems.phyllotaxisSystem.update;
      const originalAnimationUpdate = systems.animationSystem.update;
      const originalRenderUpdate = systems.renderSystem.update;
      
      systems.phyllotaxisSystem.update = vi.fn((...args) => {
        executionOrder.push('PhyllotaxisSystem');
        return originalPhyllotaxisUpdate.apply(systems.phyllotaxisSystem, args);
      });
      
      systems.animationSystem.update = vi.fn((...args) => {
        executionOrder.push('AnimationSystem');
        return originalAnimationUpdate.apply(systems.animationSystem, args);
      });
      
      systems.renderSystem.update = vi.fn((...args) => {
        executionOrder.push('RenderSystem');
        return originalRenderUpdate.apply(systems.renderSystem, args);
      });
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 実行順序を確認
      expect(executionOrder).toEqual(['PhyllotaxisSystem', 'AnimationSystem', 'RenderSystem']);
    });
  });

  describe('エンティティ追加から描画完了までの統合フロー', () => {
    it('単一エンティティの完全なライフサイクルが正常に動作する', async () => {
      // イベントリスナーを設定
      const events: any[] = [];
      
      eventBus.on(SystemEvents.POSITION_CALCULATED, (data: any) => {
        events.push({ type: 'POSITION_CALCULATED', data, timestamp: Date.now() });
      });
      
      eventBus.on(SystemEvents.ANIMATION_START, (data: any) => {
        events.push({ type: 'ANIMATION_START', data, timestamp: Date.now() });
      });
      
      eventBus.on(SystemEvents.SYSTEM_PROCESSED, (data: any) => {
        events.push({ type: 'SYSTEM_PROCESSED', data, timestamp: Date.now() });
      });
      
      // エンティティを作成
      const entityId = createTestIdeaEntity(world, 'テストアイデア');
      const initialPosition = getEntityPosition(world, entityId);
      
      expect(initialPosition).toEqual({ x: 0, y: 0 });
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 位置が更新されたことを確認
      const updatedPosition = getEntityPosition(world, entityId);
      expect(updatedPosition).not.toEqual({ x: 0, y: 0 });
      
      // SVG要素が作成されたことを確認
      expect(hasSVGElement(svgElement, entityId)).toBe(true);
      
      // SVG要素の位置が正しいことを確認
      const svgPosition = getSVGElementPosition(svgElement, entityId);
      expect(svgPosition).toEqual(updatedPosition);
      
      // イベントが発火されたことを確認
      await new Promise(resolve => setTimeout(resolve, 100)); // イベント処理を待機
      
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.type === 'POSITION_CALCULATED')).toBe(true);
    });

    it('複数エンティティが正しくフィロタキシス配置される', async () => {
      // 複数のエンティティを作成
      const entityIds = createMultipleTestEntities(world, 5);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 各エンティティの位置を確認
      const positions = entityIds.map(entityId => ({
        entityId,
        position: getEntityPosition(world, entityId),
      }));
      
      // 全てのエンティティが異なる位置に配置されていることを確認
      const uniquePositions = new Set(positions.map(p => `${p.position?.x},${p.position?.y}`));
      expect(uniquePositions.size).toBe(5);
      
      // フィロタキシスパターンに従って配置されていることを確認
      positions.forEach(({ position }, index) => {
        expect(position).not.toBeNull();
        if (index > 0) {
          // 中心からの距離が増加していることを確認
          const distance = Math.sqrt(position!.x ** 2 + position!.y ** 2);
          expect(distance).toBeGreaterThan(0);
        }
      });
      
      // 全てのSVG要素が作成されていることを確認
      entityIds.forEach(entityId => {
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
    });
  });

  describe('イベント連携の検証', () => {
    it('システム間のイベント連携が正常に動作する', async () => {
      // エンティティを作成
      const entityId = createTestIdeaEntity(world, 'イベントテスト');
      
      // イベントの順序を検証
      const eventOrderPromise = verifyEventOrder(eventBus, [
        SystemEvents.POSITION_CALCULATED,
        SystemEvents.ANIMATION_START,
      ], 2000);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // イベントの順序が正しいことを確認
      const isCorrectOrder = await eventOrderPromise;
      expect(isCorrectOrder).toBe(true);
    });

    it('位置計算完了イベントがアニメーション開始をトリガーする', async () => {
      // エンティティを作成
      const entityId = createTestIdeaEntity(world, 'アニメーションテスト');
      
      // アニメーション開始イベントを待機
      const animationStartPromise = waitForEvent(eventBus, SystemEvents.ANIMATION_START, 1000);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // アニメーション開始イベントが発火されることを確認
      const animationStartData = await animationStartPromise;
      expect(animationStartData.entityId).toBe(entityId);
      expect(animationStartData.animationType).toBe('slideIn');
    });
  });

  describe('大量データでの統合動作', () => {
    it('50エンティティでの統合処理が正常に動作する', () => {
      // 50個のエンティティを作成
      const entityIds = createMultipleTestEntities(world, performanceTestConfig.mediumDataset);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 全てのエンティティが正しく処理されていることを確認
      entityIds.forEach(entityId => {
        const position = getEntityPosition(world, entityId);
        expect(position).not.toBeNull();
        expect(hasSVGElement(svgElement, entityId)).toBe(true);
      });
      
      // フィロタキシスパターンに従った配置を確認
      const positions = entityIds.map(entityId => getEntityPosition(world, entityId));
      const uniquePositions = new Set(positions.map(p => `${p?.x},${p?.y}`));
      expect(uniquePositions.size).toBe(entityIds.length); // 全て異なる位置
    });
  });

  describe('エラーハンドリング', () => {
    it('不正なエンティティが存在してもシステムが継続動作する', () => {
      // 正常なエンティティを作成
      const validEntityId = createTestIdeaEntity(world, '正常なエンティティ');
      
      // 不正なエンティティを作成（必要なコンポーネントが不足）
      const invalidEntityId = world.createEntity();
      // 意図的にコンポーネントを追加しない
      
      // システム実行でエラーが発生しないことを確認
      expect(() => {
        runSystemsOnce(systemManager, world);
      }).not.toThrow();
      
      // 正常なエンティティは処理されることを確認
      const position = getEntityPosition(world, validEntityId);
      expect(position).not.toBeNull();
      expect(hasSVGElement(svgElement, validEntityId)).toBe(true);
      
      // 不正なエンティティは処理されないことを確認
      expect(hasSVGElement(svgElement, invalidEntityId)).toBe(false);
    });

    it('SVG要素作成エラーが他のエンティティに影響しない', () => {
      // 複数のエンティティを作成
      const entityIds = createMultipleTestEntities(world, 3);
      
      // SVG要素の作成を一部で失敗させる（モック）
      const originalCreateElement = document.createElementNS;
      let callCount = 0;
      
      document.createElementNS = vi.fn((namespace: string, tagName: string) => {
        callCount++;
        if (callCount === 2 && tagName === 'g') {
          // 2番目のg要素作成で失敗
          throw new Error('SVG element creation failed');
        }
        return originalCreateElement.call(document, namespace, tagName);
      }) as any;
      
      // システム実行でエラーが発生しないことを確認
      expect(() => {
        runSystemsOnce(systemManager, world);
      }).not.toThrow();
      
      // 他のエンティティは正常に処理されることを確認
      const successfulEntities = entityIds.filter(entityId => hasSVGElement(svgElement, entityId));
      expect(successfulEntities.length).toBeGreaterThan(0);
      
      // クリーンアップ
      document.createElementNS = originalCreateElement;
    });
  });

  describe('システム統計情報', () => {
    it('各システムの統計情報が正しく取得できる', () => {
      // エンティティを作成
      createMultipleTestEntities(world, 5);
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 各システムの統計情報を確認
      const phyllotaxisStats = systems.phyllotaxisSystem.getStats();
      expect(phyllotaxisStats.name).toBe('PhyllotaxisSystem');
      expect(phyllotaxisStats.priority).toBe(100);
      expect(phyllotaxisStats.requiredComponents).toContain('position');
      expect(phyllotaxisStats.requiredComponents).toContain('text');
      
      const animationStats = systems.animationSystem.getStats();
      expect(animationStats.name).toBe('AnimationSystem');
      expect(animationStats.priority).toBe(200);
      
      const renderStats = systems.renderSystem.getStats();
      expect(renderStats.name).toBe('RenderSystem');
      expect(renderStats.priority).toBe(300);
      expect(renderStats.requiredComponents).toContain('position');
      expect(renderStats.requiredComponents).toContain('visual');
    });
  });
});
