---
title: "ECSシステムAPI仕様"
type: api
category: ecs
tags: [api, ecs, systems, entities, components, typescript]
related:
  - "[[components]]"
  - "[[events]]"
  - "[[../architecture/ecs/overview]]"
created: 2025-02-08
---

# ECSシステムAPI仕様

> [!info] 概要
> Entity Component System (ECS) アーキテクチャのAPI仕様を定義します。

## 基本インターフェース

### Entity

```typescript
// ecs/core/Entity.ts
type EntityId = string;

interface Entity {
  readonly id: EntityId;
  readonly components: Map<ComponentType, IComponent>;
  
  // コンポーネント管理
  addComponent<T extends IComponent>(component: T): void;
  removeComponent(type: ComponentType): boolean;
  getComponent<T extends IComponent>(type: ComponentType): T | undefined;
  hasComponent(type: ComponentType): boolean;
  hasComponents(...types: ComponentType[]): boolean;
}
```

### Component

```typescript
// ecs/core/Component.ts
interface IComponent {
  readonly type: ComponentType;
}

export const ComponentTypes = {
  POSITION: 'position',
  TEXT: 'text',
  VISUAL: 'visual',
  ANIMATION: 'animation',
  INTERACTION: 'interaction'
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes];
```

### System

```typescript
// ecs/core/System.ts
export interface ISystem {
  readonly name: string;
  readonly requiredComponents: ComponentType[];
  readonly priority: number;
  
  update(entities: EntityId[], world: IWorld, deltaTime: number): void;
}

export abstract class BaseSystem implements ISystem {
  abstract readonly name: string;
  abstract readonly requiredComponents: ComponentType[];
  readonly priority: number;

  constructor(priority: number = 0) {
    this.priority = priority;
  }

  abstract update(entities: EntityId[], world: IWorld, deltaTime: number): void;

  /**
   * 必要なコンポーネントを持つエンティティのみをフィルタリング
   */
  protected filterEntities(entities: EntityId[], world: IWorld): EntityId[] {
    return entities.filter(entityId => 
      this.requiredComponents.every(type => 
        world.hasComponent(entityId, type)
      )
    );
  }
}
```

### World

```typescript
// ecs/core/World.ts
export interface IWorld {
  // エンティティ管理
  createEntity(): EntityId;
  destroyEntity(entityId: EntityId): boolean;
  hasEntity(entityId: EntityId): boolean;
  getAllEntities(): EntityId[];
  
  // コンポーネント管理
  hasComponent(entityId: EntityId, type: ComponentType): boolean;
  getComponent<T extends IComponent>(entityId: EntityId, type: ComponentType): T | undefined;
  addComponent<T extends IComponent>(entityId: EntityId, component: T): void;
  removeComponent(entityId: EntityId, type: ComponentType): void;
  
  // システム管理
  addSystem(system: ISystem): void;
  removeSystem(systemName: string): boolean;
  update(deltaTime: number): void;
  
  // クエリ
  getEntitiesWithComponents(...componentTypes: ComponentType[]): EntityId[];
  getEntitiesWithAnyComponent(...componentTypes: ComponentType[]): EntityId[];
  getEntitiesWithoutComponents(...componentTypes: ComponentType[]): EntityId[];
  
  // エンティティファクトリ統合
  createEntityFromBlueprint(blueprintName: string, ...args: any[]): EntityId;
  registerBlueprint(blueprint: EntityBlueprint): void;
  
  // バッチ操作
  batchUpdate(operations: () => void): void;
  
  // 統計・ユーティリティ
  getVersion(): number;
  getEntityStats(): EntityStats;
  getComponentStats(): ComponentStats;
  getSystemStats(): SystemStats[];
  getPerformanceStats(): PerformanceStats;
  cleanup(): void;
}

export class World implements IWorld {
  constructor(eventBus: EventBus) {
    // イベントバス統合が必須
  }
}
```#
# コンポーネント仕様

### IPositionComponent

```typescript
interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;
  x: number;
  y: number;
  angle: number;
  radius: number;
  scale: number;
  zIndex: number;
}

// ファクトリ関数
export const createPositionComponent = (
  x: number = 0,
  y: number = 0,
  angle: number = 0,
  radius: number = 0,
  scale: number = 1,
  zIndex: number = 0
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  x, y, angle, radius, scale, zIndex
});
```

### ITextComponent

```typescript
interface ITextComponent extends IComponent {
  readonly type: typeof ComponentTypes.TEXT;
  content: string;
  maxLength: number;
  isEditable: boolean;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export const createTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content'>> = {}
): ITextComponent => ({
  type: ComponentTypes.TEXT,
  content: content.slice(0, options.maxLength || 100),
  maxLength: 100,
  isEditable: true,
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  color: '#374151',
  alignment: 'center',
  ...options
});
```

### IVisualComponent

```typescript
interface IVisualComponent extends IComponent {
  readonly type: typeof ComponentTypes.VISUAL;
  shape: 'circle' | 'ellipse' | 'rect' | 'leaf' | 'custom';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  cssClasses: string[];
  customStyles: Record<string, string>;
}

export const createVisualComponent = (
  shape: IVisualComponent['shape'] = 'leaf',
  fillColor: string = '#10B981',
  strokeColor: string = '#059669',
  options: Partial<Omit<IVisualComponent, 'type' | 'shape' | 'fillColor' | 'strokeColor'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  shape,
  fillColor,
  strokeColor,
  strokeWidth: 2,
  opacity: 1,
  visible: true,
  cssClasses: [],
  customStyles: {},
  ...options
});
```

## システム仕様

### PhyllotaxisSystem

```typescript
interface PhyllotaxisSystemConfig {
  goldenAngle: number;
  radiusScale: number;
  centerX: number;
  centerY: number;
  minRadius: number;
}

class PhyllotaxisSystem extends BaseSystem {
  readonly name = 'PhyllotaxisSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];
  
  constructor(
    private config: PhyllotaxisSystemConfig,
    private eventBus: EventBus,
    priority: number = 1
  ) {
    super(priority);
  }
  
  update(entities: EntityId[], world: IWorld, deltaTime: number): void {
    const processableEntities = this.filterEntities(entities, world);
    
    processableEntities.forEach((entityId, index) => {
      const position = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
      if (!position) return;
      
      const newPos = this.calculatePhyllotaxisPosition(index);
      
      if (this.hasPositionChanged(position, newPos)) {
        this.updatePosition(position, newPos);
        this.eventBus.emit(SystemEvents.POSITION_CALCULATED, {
          entityId, position: newPos, index
        });
      }
    });
  }
  
  private calculatePhyllotaxisPosition(index: number): Position {
    const angle = index * this.config.goldenAngle * (Math.PI / 180);
    const radius = Math.sqrt(index) * this.config.radiusScale + this.config.minRadius;
    
    return {
      x: this.config.centerX + radius * Math.cos(angle),
      y: this.config.centerY + radius * Math.sin(angle),
      angle: angle * (180 / Math.PI),
      radius
    };
  }
}
```

### AnimationSystem

```typescript
class AnimationSystem extends BaseSystem {
  readonly name = 'AnimationSystem';
  readonly requiredComponents = [ComponentTypes.ANIMATION];
  
  constructor(private eventBus: EventBus, priority: number = 2) {
    super(priority);
  }
  
  update(entities: EntityId[], world: IWorld, deltaTime: number): void {
    const animatingEntities = this.filterEntities(entities, world)
      .filter(entityId => {
        const animation = world.getComponent<IAnimationComponent>(entityId, ComponentTypes.ANIMATION);
        return animation?.isAnimating;
      });
    
    animatingEntities.forEach(entityId => {
      this.updateAnimation(entityId, world, deltaTime);
    });
  }
  
  private updateAnimation(entityId: EntityId, world: IWorld, deltaTime: number): void {
    const animation = world.getComponent<IAnimationComponent>(entityId, ComponentTypes.ANIMATION);
    if (!animation || !animation.isAnimating) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);
    
    animation.progress = progress;
    
    if (progress >= 1) {
      this.completeAnimation(entityId, animation);
    }
  }
}
```

## エンティティブループリント

```typescript
interface EntityBlueprint {
  name: string;
  components: ComponentType[];
  create(entityId: EntityId, world: IWorld, ...args: any[]): void;
}

export const IdeaBlueprint: EntityBlueprint = {
  name: 'idea',
  components: [
    ComponentTypes.POSITION,
    ComponentTypes.TEXT,
    ComponentTypes.VISUAL,
    ComponentTypes.ANIMATION
  ],
  
  create(entityId: EntityId, world: IWorld, text: string) {
    world.addComponent(entityId, createTextComponent(text));
    world.addComponent(entityId, createPositionComponent());
    world.addComponent(entityId, createVisualComponent('leaf'));
    world.addComponent(entityId, createAnimationComponent());
  }
};
```

## 関連文書

> [!info] API仕様書
> - [[components|コンポーネントAPI]]
> - [[events|イベントAPI]]

> [!note] アーキテクチャ文書
> - [[../architecture/ecs/overview|ECS概要]]
> - [[../architecture/ecs/world|World設計]]
> - [[../architecture/ecs/systems|システム設計]]