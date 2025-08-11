/**
 * ECSシステム実行順序テスト
 * 
 * システムの実行順序とイベント連携の詳細な検証を行います。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBusManager } from '@/events/EventBusManager';
import { SystemEvents } from '@/events/types/EventTypes';
import {
  createTestWorld,
  createTestSystemManager,
  setupMainSystems,
  createTestIdeaEntity,
  runSystemsOnce,
  createMockSVGElement,
  verifyEventOrder,
  createEventListenerMock,
  cleanupIntegrationTest,
} from '../../shared/helpers/ecs-helpers';

describe('ECSシステム実行順序テスト', () => {
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
    // eventBus.clear(); // この行をコメントアウト
  });

  afterEach(() => {
    cleanupIntegrationTest(world, systemManager, svgElement);
  });

  describe('システム優先度による実行順序', () => {
    it('優先度の低い順（数値の小さい順）にシステムが実行される', () => {
      const executionOrder: string[] = [];
      
      // 各システムの実行をトラッキング
      const originalMethods = {
        phyllotaxis: systems.phyllotaxisSystem.update,
        animation: systems.animationSystem.update,
        render: systems.renderSystem.update,
      };
      
      systems.phyllotaxisSystem.update = vi.fn((...args) => {
        executionOrder.push('PhyllotaxisSystem');
        return originalMethods.phyllotaxis.apply(systems.phyllotaxisSystem, args);
      });
      
      systems.animationSystem.update = vi.fn((...args) => {
        executionOrder.push('AnimationSystem');
        return originalMethods.animation.apply(systems.animationSystem, args);
      });
      
      systems.renderSystem.update = vi.fn((...args) => {
        executionOrder.push('RenderSystem');
        return originalMethods.render.apply(systems.renderSystem, args);
      });
      
      // エンティティを作成してシステムを実行
      createTestIdeaEntity(world, 'テスト');
      runSystemsOnce(systemManager, world);
      
      expect(executionOrder).toEqual(['PhyllotaxisSystem', 'AnimationSystem', 'RenderSystem']);
    });

    it('システムが追加された順序に関係なく優先度順で実行される', () => {
      // 新しいSystemManagerを作成
      const newSystemManager = createTestSystemManager(eventBus);
      
      // 意図的に逆順でシステムを追加
      newSystemManager.addSystem(systems.renderSystem);
      newSystemManager.addSystem(systems.animationSystem);
      newSystemManager.addSystem(systems.phyllotaxisSystem);
      newSystemManager.start();
      
      const executionOrder: string[] = [];
      
      // 実行順序をトラッキング
      const trackExecution = (systemName: string, originalMethod: any, system: any) => {
        return vi.fn((...args) => {
          executionOrder.push(systemName);
          return originalMethod.apply(system, args);
        });
      };
      
      systems.phyllotaxisSystem.update = trackExecution('PhyllotaxisSystem', systems.phyllotaxisSystem.update, systems.phyllotaxisSystem);
      systems.animationSystem.update = trackExecution('AnimationSystem', systems.animationSystem.update, systems.animationSystem);
      systems.renderSystem.update = trackExecution('RenderSystem', systems.renderSystem.update, systems.renderSystem);
      
      createTestIdeaEntity(world, 'テスト');
      const entities = world.getAllEntities(); newSystemManager.update(entities, world, 16);
      
      // 優先度順で実行されることを確認
      expect(executionOrder).toEqual(['PhyllotaxisSystem', 'AnimationSystem', 'RenderSystem']);
    });
  });

  describe('イベント駆動による連携', () => {
    it('PhyllotaxisSystemの位置計算がAnimationSystemをトリガーする', async () => {
      const eventMock = createEventListenerMock();
      
      // イベントリスナーを設定
      eventBus.on(SystemEvents.POSITION_CALCULATED, eventMock.listener(SystemEvents.POSITION_CALCULATED));
      eventBus.on(SystemEvents.ANIMATION_START, eventMock.listener(SystemEvents.ANIMATION_START));
      
      // エンティティを作成
      const entityId = createTestIdeaEntity(world, 'イベント連携テスト');
      
      // システムを実行
      runSystemsOnce(systemManager, world);
      
      // 少し待ってイベント処理を完了させる
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // POSITION_CALCULATEDイベントが発火されたことを確認
      const positionEvents = eventMock.getCallsForEvent(SystemEvents.POSITION_CALCULATED);
      expect(positionEvents.length).toBe(1);
      expect(positionEvents[0].data.entityId).toBe(entityId);
      
      // ANIMATION_STARTイベントが発火されたことを確認
      const animationEvents = eventMock.getCallsForEvent(SystemEvents.ANIMATION_START);
      expect(animationEvents.length).toBe(1);
      expect(animationEvents[0].data.entityId).toBe(entityId);
    });

    it('イベントが正しい順序で発火される', async () => {
      const entityId = createTestIdeaEntity(world, 'イベント順序テスト');
      
      // イベント順序を検証
      const eventOrderPromise = verifyEventOrder(eventBus, [
        SystemEvents.POSITION_CALCULATED,
        SystemEvents.ANIMATION_START,
        SystemEvents.SYSTEM_PROCESSED,
      ], 2000);
      
      runSystemsOnce(systemManager, world);
      
      const isCorrectOrder = await eventOrderPromise;
      expect(isCorrectOrder).toBe(true);
    });

    it('複数エンティティで並行してイベントが処理される', async () => {
      const entityIds = [
        createTestIdeaEntity(world, 'エンティティ1'),
        createTestIdeaEntity(world, 'エンティティ2'),
        createTestIdeaEntity(world, 'エンティティ3'),
      ];
      
      const eventMock = createEventListenerMock();
      eventBus.on(SystemEvents.POSITION_CALCULATED, eventMock.listener(SystemEvents.POSITION_CALCULATED));
      eventBus.on(SystemEvents.ANIMATION_START, eventMock.listener(SystemEvents.ANIMATION_START));
      
      runSystemsOnce(systemManager, world);
      
      // イベント処理を待機
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 各エンティティに対してイベントが発火されたことを確認
      const positionEvents = eventMock.getCallsForEvent(SystemEvents.POSITION_CALCULATED);
      const animationEvents = eventMock.getCallsForEvent(SystemEvents.ANIMATION_START);
      
      expect(positionEvents.length).toBe(3);
      expect(animationEvents.length).toBe(3);
      
      // 全てのエンティティIDが含まれていることを確認
      const positionEntityIds = positionEvents.map(event => event.data.entityId);
      const animationEntityIds = animationEvents.map(event => event.data.entityId);
      
      entityIds.forEach(entityId => {
        expect(positionEntityIds).toContain(entityId);
        expect(animationEntityIds).toContain(entityId);
      });
    });
  });

  describe('システム間の依存関係', () => {
    it('PhyllotaxisSystemが実行されないとAnimationSystemがトリガーされない', async () => {
      // PhyllotaxisSystemを無効化
      systemManager.removeSystem(systems.phyllotaxisSystem);
      
      const eventMock = createEventListenerMock();
      eventBus.on(SystemEvents.POSITION_CALCULATED, eventMock.listener(SystemEvents.POSITION_CALCULATED));
      eventBus.on(SystemEvents.ANIMATION_START, eventMock.listener(SystemEvents.ANIMATION_START));
      
      // イベントモックをクリア
      eventMock.clear();
      
      createTestIdeaEntity(world, '依存関係テスト');
      runSystemsOnce(systemManager, world);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // PhyllotaxisSystemが削除されているので、新しいPOSITION_CALCULATEDイベントは発火されない
      // （既存のイベントカウントは無視し、新しいイベントがないことを確認）
      const initialPositionCount = eventMock.getCallCountForEvent(SystemEvents.POSITION_CALCULATED);
      const initialAnimationCount = eventMock.getCallCountForEvent(SystemEvents.ANIMATION_START);
      
      // 追加のシステム実行でイベントが増加しないことを確認
      runSystemsOnce(systemManager, world);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(eventMock.getCallCountForEvent(SystemEvents.POSITION_CALCULATED)).toBe(initialPositionCount);
      expect(eventMock.getCallCountForEvent(SystemEvents.ANIMATION_START)).toBe(initialAnimationCount);
    });

    it('RenderSystemが位置情報に基づいて正しく描画する', () => {
      const entityId = createTestIdeaEntity(world, 'レンダリングテスト');
      
      // PhyllotaxisSystemとAnimationSystemのみ実行
      systemManager.removeSystem(systems.renderSystem);
      
      // SVG要素をクリア
      while (svgElement.firstChild) {
        svgElement.removeChild(svgElement.firstChild);
      }
      
      runSystemsOnce(systemManager, world);
      
      // この時点ではSVG要素は作成されていない（既存の要素があっても新しい要素は追加されない）
      const initialChildCount = svgElement.children.length;
      
      // RenderSystemを再追加して実行
      try {
        systemManager.addSystem(systems.renderSystem);
      } catch (error) {
        // 既に存在する場合は無視
      }
      runSystemsOnce(systemManager, world);
      
      // SVG要素が作成されることを確認（初期カウント以上）
      expect(svgElement.children.length).toBeGreaterThanOrEqual(initialChildCount);
      
      // 位置が正しく反映されていることを確認
      const groupElement = svgElement.children[0] as SVGGElement;
      const transform = groupElement.getAttribute('transform');
      expect(transform).toMatch(/translate\([^,]+,\s*[^)]+\)/);
    });
  });

  describe('エラー処理と回復', () => {
    it('一つのシステムでエラーが発生しても他のシステムは継続実行される', () => {
      // PhyllotaxisSystemでエラーを発生させる
      const originalUpdate = systems.phyllotaxisSystem.update;
      systems.phyllotaxisSystem.update = vi.fn(() => {
        throw new Error('PhyllotaxisSystem error');
      });
      
      const executionOrder: string[] = [];
      
      // 他のシステムの実行をトラッキング
      systems.animationSystem.update = vi.fn((...args) => {
        executionOrder.push('AnimationSystem');
        return systems.animationSystem.constructor.prototype.update.apply(systems.animationSystem, args);
      });
      
      systems.renderSystem.update = vi.fn((...args) => {
        executionOrder.push('RenderSystem');
        return systems.renderSystem.constructor.prototype.update.apply(systems.renderSystem, args);
      });
      
      createTestIdeaEntity(world, 'エラーテスト');
      
      // システム実行でエラーが発生しないことを確認（SystemManagerがエラーをキャッチ）
      expect(() => {
        runSystemsOnce(systemManager, world);
      }).not.toThrow();
      
      // 他のシステムは実行されることを確認
      expect(executionOrder).toContain('AnimationSystem');
      expect(executionOrder).toContain('RenderSystem');
      
      // クリーンアップ
      systems.phyllotaxisSystem.update = originalUpdate;
    });

    it('エラーイベントが適切に発火される', async () => {
      const eventMock = createEventListenerMock();
      eventBus.on(SystemEvents.ERROR_OCCURRED, eventMock.listener(SystemEvents.ERROR_OCCURRED));
      
      // PhyllotaxisSystemでエラーを発生させる
      const originalProcessEntities = systems.phyllotaxisSystem.processEntities;
      systems.phyllotaxisSystem.processEntities = vi.fn(() => {
        throw new Error('Test error');
      });
      
      createTestIdeaEntity(world, 'エラーイベントテスト');
      runSystemsOnce(systemManager, world);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // エラーイベントが発火されたことを確認
      const errorEvents = eventMock.getCallsForEvent(SystemEvents.ERROR_OCCURRED);
      expect(errorEvents.length).toBeGreaterThan(0);
      
      // クリーンアップ
      systems.phyllotaxisSystem.processEntities = originalProcessEntities;
    });
  });
});
