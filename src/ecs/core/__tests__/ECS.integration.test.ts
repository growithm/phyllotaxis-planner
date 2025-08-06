import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '@/ecs/core/World';
import { ComponentTypes, IComponent } from '@/ecs/core/Component';
import { BaseSystem, IWorld } from '@/ecs/core/System';
import { EntityId } from '@/ecs/core/Entity';
import { EventBusImpl } from '@/events/core/EventBusImpl';

// テスト用コンポーネント
interface TestPositionComponent extends IComponent {
  readonly type: 'position';
  x: number;
  y: number;
  angle: number;
  radius: number;
}

interface TestTextComponent extends IComponent {
  readonly type: 'text';
  content: string;
  maxLength: number;
}

interface TestAnimationComponent extends IComponent {
  readonly type: 'animation';
  isAnimating: boolean;
  duration: number;
  progress: number;
}

// ファクトリ関数
const createTestPositionComponent = (
  x: number = 0,
  y: number = 0,
  angle: number = 0,
  radius: number = 0
): TestPositionComponent => ({
  type: 'position',
  x, y, angle, radius
});

const createTestTextComponent = (
  content: string = '',
  maxLength: number = 100
): TestTextComponent => ({
  type: 'text',
  content: content.slice(0, maxLength),
  maxLength
});

const createTestAnimationComponent = (
  duration: number = 500
): TestAnimationComponent => ({
  type: 'animation',
  isAnimating: false,
  duration,
  progress: 0
});

// テスト用システム
class TestPhyllotaxisSystem extends BaseSystem {
  readonly name = 'TestPhyllotaxisSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];
  
  public processedEntities: EntityId[] = [];

  constructor() {
    super(1); // 高優先度
  }

  protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
    this.processedEntities = [...entities];

    // フィロタキシス配置計算のシミュレーション
    entities.forEach((entityId, index) => {
      const position = world.getComponent<TestPositionComponent>(entityId, ComponentTypes.POSITION);
      if (position) {
        // 簡単な螺旋配置計算
        const angle = index * 137.5 * (Math.PI / 180);
        const radius = Math.sqrt(index) * 20 + 50;
        
        position.x = 400 + radius * Math.cos(angle);
        position.y = 300 + radius * Math.sin(angle);
        position.angle = angle * (180 / Math.PI);
        position.radius = radius;
      }
    });
  }
}

class TestAnimationSystem extends BaseSystem {
  readonly name = 'TestAnimationSystem';
  readonly requiredComponents = [ComponentTypes.ANIMATION];
  
  public animatedEntities: EntityId[] = [];

  constructor() {
    super(2); // 中優先度
  }

  protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
    this.animatedEntities = [];

    entities.forEach(entityId => {
      const animation = world.getComponent<TestAnimationComponent>(entityId, ComponentTypes.ANIMATION);
      if (animation && animation.isAnimating) {
        animation.progress = Math.min(animation.progress + deltaTime / animation.duration, 1);
        this.animatedEntities.push(entityId);
        
        if (animation.progress >= 1) {
          animation.isAnimating = false;
        }
      }
    });
  }
}

describe('ECS Integration Tests', () => {
  let world: World;
  let phyllotaxisSystem: TestPhyllotaxisSystem;
  let animationSystem: TestAnimationSystem;

  beforeEach(() => {
    const eventBus = new EventBusImpl();
    world = new World(eventBus);
    phyllotaxisSystem = new TestPhyllotaxisSystem();
    animationSystem = new TestAnimationSystem();
    
    world.addSystem(phyllotaxisSystem);
    world.addSystem(animationSystem);
    world.startSystems();
  });

  describe('Complete Idea Addition Flow', () => {
    it('should handle idea creation and positioning', () => {
      // アイデアエンティティを作成
      const idea1 = world.createEntity();
      const idea2 = world.createEntity();
      const idea3 = world.createEntity();

      // コンポーネントを追加
      world.addComponent(idea1, createTestPositionComponent());
      world.addComponent(idea1, createTestTextComponent('First Idea'));
      world.addComponent(idea1, createTestAnimationComponent());

      world.addComponent(idea2, createTestPositionComponent());
      world.addComponent(idea2, createTestTextComponent('Second Idea'));
      world.addComponent(idea2, createTestAnimationComponent());

      world.addComponent(idea3, createTestPositionComponent());
      world.addComponent(idea3, createTestTextComponent('Third Idea'));
      world.addComponent(idea3, createTestAnimationComponent());

      // アニメーションを開始
      const anim1 = world.getComponent<TestAnimationComponent>(idea1, ComponentTypes.ANIMATION)!;
      const anim2 = world.getComponent<TestAnimationComponent>(idea2, ComponentTypes.ANIMATION)!;
      anim1.isAnimating = true;
      anim2.isAnimating = true;

      // システムを実行
      world.update(16);

      // PhyllotaxisSystemが適切に動作したことを確認
      expect(phyllotaxisSystem.processedEntities).toHaveLength(3);
      expect(phyllotaxisSystem.processedEntities).toContain(idea1);
      expect(phyllotaxisSystem.processedEntities).toContain(idea2);
      expect(phyllotaxisSystem.processedEntities).toContain(idea3);

      // 位置が計算されたことを確認
      const pos1 = world.getComponent<TestPositionComponent>(idea1, ComponentTypes.POSITION)!;
      const pos2 = world.getComponent<TestPositionComponent>(idea2, ComponentTypes.POSITION)!;
      const pos3 = world.getComponent<TestPositionComponent>(idea3, ComponentTypes.POSITION)!;

      expect(pos1.x).not.toBe(0);
      expect(pos1.y).not.toBe(0);
      expect(pos2.x).not.toBe(pos1.x);
      expect(pos2.y).not.toBe(pos1.y);
      expect(pos3.x).not.toBe(pos2.x);
      expect(pos3.y).not.toBe(pos2.y);

      // AnimationSystemが適切に動作したことを確認
      expect(animationSystem.animatedEntities).toHaveLength(2);
      expect(animationSystem.animatedEntities).toContain(idea1);
      expect(animationSystem.animatedEntities).toContain(idea2);

      // アニメーション進行度が更新されたことを確認
      expect(anim1.progress).toBeGreaterThan(0);
      expect(anim2.progress).toBeGreaterThan(0);
    });
  });

  describe('System Priority and Execution Order', () => {
    it('should execute systems in priority order', () => {
      const executionOrder: string[] = [];

      // 実行順序を記録するシステムを作成
      class OrderTrackingSystem extends BaseSystem {
        constructor(public systemName: string, priority: number) {
          super(priority);
        }

        readonly name = this.systemName;
        readonly requiredComponents = [ComponentTypes.POSITION];

        protected processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void {
          executionOrder.push(this.systemName);
        }
      }

      const eventBus2 = new EventBusImpl();
      const world2 = new World(eventBus2);
      const lowPrioritySystem = new OrderTrackingSystem('LowPriority', 3);
      const highPrioritySystem = new OrderTrackingSystem('HighPriority', 1);
      const mediumPrioritySystem = new OrderTrackingSystem('MediumPriority', 2);

      // 順序を意図的に混ぜて追加
      world2.addSystem(lowPrioritySystem);
      world2.addSystem(highPrioritySystem);
      world2.addSystem(mediumPrioritySystem);
      world2.startSystems();

      // エンティティを作成
      const entity = world2.createEntity();
      world2.addComponent(entity, createTestPositionComponent());

      // システムを実行
      world2.update(16);

      // 優先度順に実行されたことを確認
      expect(executionOrder).toEqual(['HighPriority', 'MediumPriority', 'LowPriority']);
    });
  });

  describe('Component Type Guards and Safety', () => {
    it('should handle component type safety', () => {
      const entity = world.createEntity();
      
      // 異なるタイプのコンポーネントを追加
      world.addComponent(entity, createTestPositionComponent(100, 200));
      world.addComponent(entity, createTestTextComponent('Test'));

      // 正しいタイプで取得
      const position = world.getComponent<TestPositionComponent>(entity, ComponentTypes.POSITION);
      const text = world.getComponent<TestTextComponent>(entity, ComponentTypes.TEXT);

      expect(position?.type).toBe('position');
      expect(position?.x).toBe(100);
      expect(text?.type).toBe('text');
      expect(text?.content).toBe('Test');

      // 存在しないコンポーネントタイプ
      const visual = world.getComponent(entity, ComponentTypes.VISUAL);
      expect(visual).toBeUndefined();
    });
  });

  describe('Entity Lifecycle Management', () => {
    it('should properly cleanup entity and components on destruction', () => {
      const entity1 = world.createEntity();
      const entity2 = world.createEntity();

      // コンポーネントを追加
      world.addComponent(entity1, createTestPositionComponent());
      world.addComponent(entity1, createTestTextComponent('Entity 1'));
      world.addComponent(entity2, createTestPositionComponent());
      world.addComponent(entity2, createTestTextComponent('Entity 2'));

      // 初期状態を確認
      expect(world.getAllEntities()).toHaveLength(2);
      expect(world.getComponentStats()[ComponentTypes.POSITION]).toBe(2);
      expect(world.getComponentStats()[ComponentTypes.TEXT]).toBe(2);

      // エンティティを削除
      world.destroyEntity(entity1);

      // エンティティが削除されたことを確認
      expect(world.getAllEntities()).toHaveLength(1);
      expect(world.hasEntity(entity1)).toBe(false);
      expect(world.hasEntity(entity2)).toBe(true);

      // コンポーネントも削除されたことを確認
      expect(world.getComponentStats()[ComponentTypes.POSITION]).toBe(1);
      expect(world.getComponentStats()[ComponentTypes.TEXT]).toBe(1);

      // 削除されたエンティティのコンポーネントにアクセスできないことを確認
      expect(world.getComponent(entity1, ComponentTypes.POSITION)).toBeUndefined();
      expect(world.getComponent(entity1, ComponentTypes.TEXT)).toBeUndefined();

      // 残ったエンティティは正常にアクセスできることを確認
      expect(world.getComponent(entity2, ComponentTypes.POSITION)).toBeDefined();
      expect(world.getComponent(entity2, ComponentTypes.TEXT)).toBeDefined();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large number of entities efficiently', () => {
      const entityCount = 100;
      const entities: EntityId[] = [];

      // 大量のエンティティを作成
      for (let i = 0; i < entityCount; i++) {
        const entity = world.createEntity();
        world.addComponent(entity, createTestPositionComponent(i, i));
        world.addComponent(entity, createTestTextComponent(`Idea ${i}`));
        entities.push(entity);
      }

      // システムを実行
      const startTime = performance.now();
      world.update(16);
      const endTime = performance.now();

      // パフォーマンスを確認（16ms以内で完了することを期待）
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(16);

      // 全エンティティが処理されたことを確認
      expect(phyllotaxisSystem.processedEntities).toHaveLength(entityCount);

      // 統計情報を確認
      const stats = world.getPerformanceStats();
      expect(stats.entityCount).toBe(entityCount);
      expect(stats.componentCount).toBe(entityCount * 2); // Position + Text
    });

    it('should reuse entity IDs after destruction', () => {
      // エンティティを作成して削除
      const entity1 = world.createEntity();
      const originalId = entity1;
      world.destroyEntity(entity1);

      // 新しいエンティティを作成
      const entity2 = world.createEntity();

      // IDが再利用されることを確認
      expect(entity2).toBe(originalId);
    });
  });
});