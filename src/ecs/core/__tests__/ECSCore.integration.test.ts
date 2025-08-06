/**
 * ECSコア統合テスト（World + SystemManager + EventBus）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { World } from '@/ecs/core/World';
import { BaseSystem, ISystem, IWorld } from '@/ecs/core/System';
import { ComponentTypes } from '@/ecs/core/Component';
import { createPositionComponent, createTextComponent } from '@/ecs/components';
import { EventBusImpl } from '@/events/core';
import { SystemEvents, LifecycleEvents } from '@/events/types/EventTypes';
import { EntityId } from '@/ecs/core/Entity';

// テスト用システム実装
class TestPhyllotaxisSystem extends BaseSystem {
  readonly name = 'TestPhyllotaxisSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];

  constructor(priority: number = 1) {
    super(priority);
  }

  protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
    entities.forEach((entityId, index) => {
      const position = world.getComponent(entityId, ComponentTypes.POSITION);
      if (position) {
        // テスト用の位置更新
        position.x = index * 10;
        position.y = index * 10;
      }
    });
  }

  protected emitEvents(entities: EntityId[], world: IWorld, deltaTime: number): void {
    super.emitEvents(entities, world, deltaTime);
    
    if (this.eventBus) {
      entities.forEach((entityId, index) => {
        this.eventBus!.emit(SystemEvents.POSITION_CALCULATED, {
          entityId,
          position: { x: index * 10, y: index * 10 },
          angle: 0,
          radius: index * 10,
          index
        });
      });
    }
  }
}

class TestAnimationSystem extends BaseSystem {
  readonly name = 'TestAnimationSystem';
  readonly requiredComponents = [ComponentTypes.ANIMATION];

  constructor(priority: number = 2) {
    super(priority);
  }

  protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
    // テスト用のアニメーション処理
    entities.forEach(entityId => {
      // アニメーション処理のモック
    });
  }
}

describe('ECSコア統合テスト', () => {
  let world: World;
  let eventBus: EventBusImpl;
  let testSystem1: TestPhyllotaxisSystem;
  let testSystem2: TestAnimationSystem;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    world = new World(eventBus);
    testSystem1 = new TestPhyllotaxisSystem(1);
    testSystem2 = new TestAnimationSystem(2);
  });

  describe('World + SystemManager + EventBus統合', () => {
    it('should integrate World, SystemManager, and EventBus correctly', () => {
      // システム追加
      world.addSystem(testSystem1);
      world.addSystem(testSystem2);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      // 結果確認
      const position = world.getComponent(entityId, ComponentTypes.POSITION);
      expect(position?.x).toBe(0); // 最初のエンティティなのでindex=0
      expect(position?.y).toBe(0);
    });

    it('should handle system execution order by priority', () => {
      const executionOrder: string[] = [];

      class OrderTestSystem1 extends BaseSystem {
        readonly name = 'OrderTest1';
        readonly requiredComponents = [ComponentTypes.TEXT];

        constructor() {
          super(3); // 低優先度
        }

        protected processEntities(): void {
          executionOrder.push('System1');
        }
      }

      class OrderTestSystem2 extends BaseSystem {
        readonly name = 'OrderTest2';
        readonly requiredComponents = [ComponentTypes.TEXT];

        constructor() {
          super(1); // 高優先度
        }

        protected processEntities(): void {
          executionOrder.push('System2');
        }
      }

      const system1 = new OrderTestSystem1();
      const system2 = new OrderTestSystem2();

      world.addSystem(system1);
      world.addSystem(system2);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      // 優先度順に実行されることを確認
      expect(executionOrder).toEqual(['System2', 'System1']);
    });
  });

  describe('システム実行フローテスト（3フェーズ実行）', () => {
    it('should execute systems in 3 phases: filter -> process -> emit', () => {
      const phases: string[] = [];

      class PhaseTestSystem extends BaseSystem {
        readonly name = 'PhaseTest';
        readonly requiredComponents = [ComponentTypes.TEXT];

        constructor() {
          super(1);
        }

        protected filterEntities(entities: EntityId[], world: IWorld): EntityId[] {
          phases.push('filter');
          return super.filterEntities(entities, world);
        }

        protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
          phases.push('process');
        }

        protected emitEvents(entities: EntityId[], world: IWorld, deltaTime: number): void {
          phases.push('emit');
          super.emitEvents(entities, world, deltaTime);
        }
      }

      const phaseSystem = new PhaseTestSystem();
      world.addSystem(phaseSystem);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      // 3フェーズが順序通り実行されることを確認
      expect(phases).toEqual(['filter', 'process', 'emit']);
    });

    it('should skip processing when no entities match requirements', () => {
      const phases: string[] = [];

      class EmptyTestSystem extends BaseSystem {
        readonly name = 'EmptyTest';
        readonly requiredComponents = [ComponentTypes.ANIMATION]; // 存在しないコンポーネント

        constructor() {
          super(1);
        }

        protected filterEntities(entities: EntityId[], world: IWorld): EntityId[] {
          phases.push('filter');
          return super.filterEntities(entities, world);
        }

        protected processEntities(): void {
          phases.push('process');
        }

        protected emitEvents(): void {
          phases.push('emit');
        }
      }

      const emptySystem = new EmptyTestSystem();
      world.addSystem(emptySystem);
      world.startSystems();

      // エンティティ作成（ANIMATIONコンポーネントなし）
      const entityId = world.createEntity();
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      // フィルタリングのみ実行され、処理対象がないため後続フェーズはスキップ
      expect(phases).toEqual(['filter']);
    });
  });

  describe('イベント統合テスト（システム間連携）', () => {
    it('should emit lifecycle events on entity creation and destruction', () => {
      const lifecycleEvents: string[] = [];

      eventBus.on(LifecycleEvents.AFTER_CREATE, () => {
        lifecycleEvents.push('created');
      });

      eventBus.on(LifecycleEvents.BEFORE_DESTROY, () => {
        lifecycleEvents.push('before_destroy');
      });

      eventBus.on(LifecycleEvents.AFTER_DESTROY, () => {
        lifecycleEvents.push('after_destroy');
      });

      // エンティティ作成・削除
      const entityId = world.createEntity();
      world.destroyEntity(entityId);

      expect(lifecycleEvents).toEqual(['created', 'before_destroy', 'after_destroy']);
    });

    it('should emit system events during execution', () => {
      const systemEvents: string[] = [];

      eventBus.on(SystemEvents.SYSTEM_READY, (data) => {
        systemEvents.push(`${data.systemName}_ready`);
      });

      eventBus.on(SystemEvents.POSITION_CALCULATED, (data) => {
        systemEvents.push(`position_calculated_${data.entityId}`);
      });

      // EventBusを持つシステムを作成
      const eventSystem = new TestPhyllotaxisSystem(1);
      eventSystem['eventBus'] = eventBus; // テスト用にEventBusを設定

      world.addSystem(eventSystem);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      expect(systemEvents).toContain('TestPhyllotaxisSystem_ready');
      expect(systemEvents).toContain(`position_calculated_${entityId}`);
    });

    it('should handle system errors gracefully', () => {
      const errorEvents: any[] = [];

      eventBus.on(SystemEvents.ERROR_OCCURRED, (data) => {
        errorEvents.push(data);
      });

      class ErrorSystem extends BaseSystem {
        readonly name = 'ErrorSystem';
        readonly requiredComponents = [ComponentTypes.TEXT];

        constructor() {
          super(1);
        }

        protected processEntities(): void {
          throw new Error('Test error');
        }
      }

      const errorSystem = new ErrorSystem();
      world.addSystem(errorSystem);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行（エラーが発生するが継続される）
      expect(() => world.update(16)).not.toThrow();

      // エラーイベントが発火されることを確認
      expect(errorEvents).toHaveLength(1);
      expect(errorEvents[0].source).toBe('ErrorSystem');
      expect(errorEvents[0].message).toBe('Test error');
    });
  });

  describe('パフォーマンス統計テスト', () => {
    it('should collect system performance statistics', () => {
      world.addSystem(testSystem1);
      world.startSystems();

      // エンティティ作成
      const entityId = world.createEntity();
      world.addComponent(entityId, createPositionComponent(0, 0));
      world.addComponent(entityId, createTextComponent('test'));

      // システム実行
      world.update(16);

      // 統計情報確認
      const stats = world.getSystemStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].name).toBe('TestPhyllotaxisSystem');
      expect(stats[0].processableEntities).toBe(1);
      expect(stats[0].lastExecutionTime).toBeTypeOf('number');
    });

    it('should track World performance metrics', () => {
      // エンティティとコンポーネント作成
      const entityId1 = world.createEntity();
      const entityId2 = world.createEntity();
      
      world.addComponent(entityId1, createPositionComponent(0, 0));
      world.addComponent(entityId1, createTextComponent('test1'));
      world.addComponent(entityId2, createTextComponent('test2'));

      world.addSystem(testSystem1);

      const perfStats = world.getPerformanceStats();
      
      expect(perfStats.entityCount).toBe(2);
      expect(perfStats.componentCount).toBe(3);
      expect(perfStats.systemCount).toBe(1);
      expect(perfStats.version).toBeGreaterThan(0);
      expect(perfStats.memoryUsage).toBeGreaterThan(0);
    });
  });
});