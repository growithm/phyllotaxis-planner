import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemManager } from '@/ecs/core/SystemManager';
import { BaseSystem, IWorld } from '@/ecs/core/System';
import { EntityId } from '@/ecs/core/Entity';
import { ComponentTypes } from '@/ecs/core/Component';

// テスト用システム
class TestSystem extends BaseSystem {
  readonly name = 'TestSystem';
  readonly requiredComponents = [ComponentTypes.POSITION];
  
  public updateCallCount = 0;
  public lastEntities: EntityId[] = [];
  public lastDeltaTime = 0;

  update(entities: EntityId[], _world: IWorld, deltaTime: number): void {
    this.updateCallCount++;
    this.lastEntities = [...entities];
    this.lastDeltaTime = deltaTime;
  }
}

// グローバル実行カウンター
let globalExecutionCounter = 0;

class HighPrioritySystem extends BaseSystem {
  readonly name = 'HighPrioritySystem';
  readonly requiredComponents = [ComponentTypes.TEXT];
  
  public executionOrder: number = 0;

  constructor() {
    super(-1); // 高優先度
  }

  update(_entities: EntityId[], _world: IWorld, _deltaTime: number): void {
    this.executionOrder = ++globalExecutionCounter;
  }
}

class LowPrioritySystem extends BaseSystem {
  readonly name = 'LowPrioritySystem';
  readonly requiredComponents = [ComponentTypes.VISUAL];
  
  public executionOrder: number = 0;

  constructor() {
    super(1); // 低優先度
  }

  update(_entities: EntityId[], _world: IWorld, _deltaTime: number): void {
    this.executionOrder = ++globalExecutionCounter;
  }
}

// モックWorld
const createMockWorld = (): IWorld => ({
  hasComponent: vi.fn().mockReturnValue(true),
  getComponent: vi.fn(),
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
  getAllEntities: vi.fn().mockReturnValue(['entity_1', 'entity_2'])
});

describe('SystemManager', () => {
  let manager: SystemManager;
  let mockWorld: IWorld;

  beforeEach(() => {
    manager = new SystemManager();
    mockWorld = createMockWorld();
    // グローバルカウンターをリセット
    globalExecutionCounter = 0;
  });

  describe('addSystem', () => {
    it('should add system successfully', () => {
      const system = new TestSystem();
      manager.addSystem(system);

      const systems = manager.getAllSystems();
      expect(systems).toHaveLength(1);
      expect(systems[0]).toBe(system);
    });

    it('should throw error when adding system with duplicate name', () => {
      const system1 = new TestSystem();
      const system2 = new TestSystem();

      manager.addSystem(system1);
      
      expect(() => manager.addSystem(system2)).toThrow(
        "System with name 'TestSystem' already exists"
      );
    });

    it('should sort systems by priority', () => {
      const highPriority = new HighPrioritySystem();
      const lowPriority = new LowPrioritySystem();
      const normalPriority = new TestSystem();

      manager.addSystem(lowPriority);
      manager.addSystem(normalPriority);
      manager.addSystem(highPriority);

      const systems = manager.getAllSystems();
      expect(systems[0]).toBe(highPriority); // priority: -1
      expect(systems[1]).toBe(normalPriority); // priority: 0
      expect(systems[2]).toBe(lowPriority); // priority: 1
    });
  });

  describe('removeSystem', () => {
    it('should remove system successfully', () => {
      const system = new TestSystem();
      manager.addSystem(system);

      const removed = manager.removeSystem('TestSystem');
      expect(removed).toBe(true);
      expect(manager.getAllSystems()).toHaveLength(0);
    });

    it('should return false when removing non-existent system', () => {
      const removed = manager.removeSystem('NonExistentSystem');
      expect(removed).toBe(false);
    });
  });

  describe('getSystem', () => {
    it('should return system by name', () => {
      const system = new TestSystem();
      manager.addSystem(system);

      const retrieved = manager.getSystem('TestSystem');
      expect(retrieved).toBe(system);
    });

    it('should return undefined for non-existent system', () => {
      const retrieved = manager.getSystem('NonExistentSystem');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('start/stop', () => {
    it('should control running state', () => {
      expect(manager.getIsRunning()).toBe(false);

      manager.start();
      expect(manager.getIsRunning()).toBe(true);

      manager.stop();
      expect(manager.getIsRunning()).toBe(false);
    });
  });

  describe('update', () => {
    it('should not update systems when not running', () => {
      const system = new TestSystem();
      manager.addSystem(system);

      manager.update(['entity_1'], mockWorld, 16);
      expect(system.updateCallCount).toBe(0);
    });

    it('should update systems when running', () => {
      const system = new TestSystem();
      manager.addSystem(system);
      manager.start();

      manager.update(['entity_1'], mockWorld, 16);
      
      expect(system.updateCallCount).toBe(1);
      expect(system.lastEntities).toEqual(['entity_1']);
      expect(system.lastDeltaTime).toBe(16);
    });

    it('should execute systems in priority order', () => {
      const highPriority = new HighPrioritySystem();
      const lowPriority = new LowPrioritySystem();

      manager.addSystem(lowPriority);
      manager.addSystem(highPriority);
      manager.start();

      manager.update([], mockWorld, 16);

      expect(highPriority.executionOrder).toBe(1); // 先に実行
      expect(lowPriority.executionOrder).toBe(2); // 後に実行
    });

    it('should continue execution even if system throws error', () => {
      const errorSystem = new TestSystem();
      errorSystem.update = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      class NormalSystem extends BaseSystem {
        readonly name = 'NormalSystem';
        readonly requiredComponents = [ComponentTypes.POSITION];
        
        public updateCallCount = 0;

        update(_entities: EntityId[], _world: IWorld, _deltaTime: number): void {
          this.updateCallCount++;
        }
      }

      const normalSystem = new NormalSystem();

      manager.addSystem(errorSystem);
      manager.addSystem(normalSystem);
      manager.start();

      // エラーをコンソールに出力するが、実行は継続される
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      manager.update([], mockWorld, 16);

      expect(consoleSpy).toHaveBeenCalled();
      expect(normalSystem.updateCallCount).toBe(1); // 正常なシステムは実行される
      
      consoleSpy.mockRestore();
    });
  });

  describe('getSystemStats', () => {
    it('should return system statistics', () => {
      const system = new TestSystem();
      manager.addSystem(system);

      const stats = manager.getSystemStats(mockWorld);
      expect(stats).toHaveLength(1);
      expect(stats[0].name).toBe('TestSystem');
      expect(stats[0].priority).toBe(0);
      expect(stats[0].requiredComponents).toEqual([ComponentTypes.POSITION]);
      expect(stats[0].processableEntities).toBe(2); // mockWorldが2つのエンティティを返す
    });
  });

  describe('clear', () => {
    it('should clear all systems and reset state', () => {
      const system = new TestSystem();
      manager.addSystem(system);
      manager.start();

      manager.clear();

      expect(manager.getAllSystems()).toHaveLength(0);
      expect(manager.getIsRunning()).toBe(false);
    });
  });
});