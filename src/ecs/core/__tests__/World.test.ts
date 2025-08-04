import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@/ecs/core/World';
import { ComponentTypes, IComponent } from '@/ecs/core/Component';
import { BaseSystem, IWorld } from '@/ecs/core/System';
import { EntityId } from '@/ecs/core/Entity';

// テスト用コンポーネント
interface TestPositionComponent extends IComponent {
  readonly type: 'position';
  x: number;
  y: number;
}

interface TestTextComponent extends IComponent {
  readonly type: 'text';
  content: string;
}

const createTestPositionComponent = (x: number = 0, y: number = 0): TestPositionComponent => ({
  type: 'position',
  x,
  y
});

const createTestTextComponent = (content: string = ''): TestTextComponent => ({
  type: 'text',
  content
});

// テスト用システム
class TestSystem extends BaseSystem {
  readonly name = 'TestSystem';
  readonly requiredComponents = [ComponentTypes.POSITION];
  
  public updateCallCount = 0;
  public lastEntities: EntityId[] = [];

  update(entities: EntityId[], world: IWorld, _deltaTime: number): void {
    const processableEntities = this.filterEntities(entities, world);
    this.updateCallCount++;
    this.lastEntities = [...processableEntities];
  }
}

describe('World', () => {
  let world: World;

  beforeEach(() => {
    world = new World();
  });

  describe('Entity Management', () => {
    it('should create and destroy entities', () => {
      const entityId = world.createEntity();
      expect(world.hasEntity(entityId)).toBe(true);
      expect(entityId).toMatch(/^entity_\d+$/);

      const destroyed = world.destroyEntity(entityId);
      expect(destroyed).toBe(true);
      expect(world.hasEntity(entityId)).toBe(false);
    });

    it('should return false when destroying non-existent entity', () => {
      const destroyed = world.destroyEntity('non_existent');
      expect(destroyed).toBe(false);
    });

    it('should get all entities', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      const allEntities = world.getAllEntities();
      expect(allEntities).toHaveLength(2);
      expect(allEntities).toContain(entity1);
      expect(allEntities).toContain(entity2);
    });

    it('should provide entity statistics', () => {
      world.createEntity();
      world.createEntity();

      const stats = world.getEntityStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(2);
      expect(stats.poolStats.active).toBe(2);
    });
  });

  describe('Component Management', () => {
    it('should add and remove components', () => {
      const entityId = world.createEntity();
      const position = createTestPositionComponent(100, 200);

      world.addComponent(entityId, position);
      expect(world.hasComponent(entityId, ComponentTypes.POSITION)).toBe(true);

      const retrieved = world.getComponent<TestPositionComponent>(entityId, ComponentTypes.POSITION);
      expect(retrieved?.x).toBe(100);
      expect(retrieved?.y).toBe(200);

      const removed = world.removeComponent(entityId, ComponentTypes.POSITION);
      expect(removed).toBe(true);
      expect(world.hasComponent(entityId, ComponentTypes.POSITION)).toBe(false);
    });

    it('should throw error when adding component to non-existent entity', () => {
      const position = createTestPositionComponent();
      
      expect(() => {
        world.addComponent('non_existent', position);
      }).toThrow('Entity non_existent does not exist');
    });

    it('should check multiple components', () => {
      const entityId = world.createEntity();
      const position = createTestPositionComponent();
      const text = createTestTextComponent('test');

      world.addComponent(entityId, position);
      world.addComponent(entityId, text);

      expect(world.hasComponents(entityId, [ComponentTypes.POSITION, ComponentTypes.TEXT])).toBe(true);
      expect(world.hasComponents(entityId, [ComponentTypes.POSITION, ComponentTypes.VISUAL])).toBe(false);
    });

    it('should get entities with specific components', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      const entity3 = world.createEntity();

      world.addComponent(entity1, createTestPositionComponent());
      world.addComponent(entity2, createTestPositionComponent());
      world.addComponent(entity2, createTestTextComponent());
      world.addComponent(entity3, createTestTextComponent());

      const withPosition = world.getEntitiesWithComponents(ComponentTypes.POSITION);
      expect(withPosition).toHaveLength(2);
      expect(withPosition).toContain(entity1);
      expect(withPosition).toContain(entity2);

      const withBoth = world.getEntitiesWithComponents(ComponentTypes.POSITION, ComponentTypes.TEXT);
      expect(withBoth).toHaveLength(1);
      expect(withBoth).toContain(entity2);

      const withAny = world.getEntitiesWithAnyComponent(ComponentTypes.POSITION, ComponentTypes.TEXT);
      expect(withAny).toHaveLength(3);

      const withoutPosition = world.getEntitiesWithoutComponents(ComponentTypes.POSITION);
      expect(withoutPosition).toHaveLength(1);
      expect(withoutPosition).toContain(entity3);
    });

    it('should provide component statistics', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      world.addComponent(entity1, createTestPositionComponent());
      world.addComponent(entity2, createTestPositionComponent());
      world.addComponent(entity1, createTestTextComponent());

      const stats = world.getComponentStats();
      expect(stats[ComponentTypes.POSITION]).toBe(2);
      expect(stats[ComponentTypes.TEXT]).toBe(1);
      expect(stats[ComponentTypes.VISUAL]).toBe(0);
    });
  });

  describe('System Management', () => {
    it('should add and remove systems', () => {
      const system = new TestSystem();
      world.addSystem(system);

      const stats = world.getSystemStats();
      expect(stats).toHaveLength(1);
      expect(stats[0].name).toBe('TestSystem');

      const removed = world.removeSystem('TestSystem');
      expect(removed).toBe(true);
      expect(world.getSystemStats()).toHaveLength(0);
    });

    it('should execute systems on update', () => {
      const system = new TestSystem();
      world.addSystem(system);
      world.startSystems();

      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, createTestPositionComponent());

      world.update(16);

      expect(system.updateCallCount).toBe(1);
      expect(system.lastEntities).toHaveLength(1);
      expect(system.lastEntities).toContain(entity1);
    });

    it('should not execute systems when stopped', () => {
      const system = new TestSystem();
      world.addSystem(system);
      // システムを開始しない

      world.update(16);
      expect(system.updateCallCount).toBe(0);
    });
  });

  describe('Version Management', () => {
    it('should increment version on entity operations', () => {
      const initialVersion = world.getVersion();
      
      const entityId = world.createEntity();
      expect(world.getVersion()).toBe(initialVersion + 1);

      world.addComponent(entityId, createTestPositionComponent());
      expect(world.getVersion()).toBe(initialVersion + 2);

      world.removeComponent(entityId, ComponentTypes.POSITION);
      expect(world.getVersion()).toBe(initialVersion + 3);

      world.destroyEntity(entityId);
      expect(world.getVersion()).toBe(initialVersion + 4);
    });

    it('should handle batch updates', () => {
      const initialVersion = world.getVersion();

      world.batchUpdate(() => {
        const entity1 = world.createEntity();
        const entity2 = world.createEntity();
        world.addComponent(entity1, createTestPositionComponent());
        world.addComponent(entity2, createTestTextComponent());
      });

      // バッチ操作中に複数回バージョンが更新される
      expect(world.getVersion()).toBeGreaterThan(initialVersion);
    });
  });

  describe('Performance Stats', () => {
    it('should provide performance statistics', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, createTestPositionComponent());
      world.addComponent(entity2, createTestTextComponent());

      const stats = world.getPerformanceStats();
      expect(stats.entityCount).toBe(2);
      expect(stats.componentCount).toBe(2);
      expect(stats.systemCount).toBe(0);
      expect(stats.version).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Cleanup', () => {
    it('should clear all data', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      world.addComponent(entity1, createTestPositionComponent());
      world.addComponent(entity2, createTestTextComponent());

      world.clear();

      expect(world.getAllEntities()).toHaveLength(0);
      expect(world.getVersion()).toBe(0);
      expect(world.getEntityStats().total).toBe(0);
    });

    it('should cleanup unused components', () => {
      const entity1 = world.createEntity();
      world.addComponent(entity1, createTestPositionComponent());

      // エンティティを削除
      world.destroyEntity(entity1);

      // クリーンアップを実行
      world.cleanup();

      const stats = world.getComponentStats();
      expect(stats[ComponentTypes.POSITION]).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should handle complete ECS workflow', () => {
      // システムを追加
      const system = new TestSystem();
      world.addSystem(system);
      world.startSystems();

      // エンティティを作成してコンポーネントを追加
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();
      
      world.addComponent(entity1, createTestPositionComponent(100, 200));
      world.addComponent(entity1, createTestTextComponent('idea1'));
      world.addComponent(entity2, createTestTextComponent('idea2'));

      // システムを実行
      world.update(16);

      // システムが適切なエンティティのみを処理したことを確認
      expect(system.updateCallCount).toBe(1);
      expect(system.lastEntities).toHaveLength(1);
      expect(system.lastEntities).toContain(entity1);

      // 統計情報を確認
      const entityStats = world.getEntityStats();
      const componentStats = world.getComponentStats();
      const systemStats = world.getSystemStats();

      expect(entityStats.total).toBe(2);
      expect(componentStats[ComponentTypes.POSITION]).toBe(1);
      expect(componentStats[ComponentTypes.TEXT]).toBe(2);
      expect(systemStats).toHaveLength(1);
      expect(systemStats[0].processableEntities).toBe(1);
    });
  });
});