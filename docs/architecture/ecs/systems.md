---
title: "ECSシステム設計"
type: architecture
category: ecs
tags: [architecture, ecs, systems, logic, processing]
related:
  - "[[overview]]"
  - "[[components]]"
  - "[[integration]]"
  - "[[../data-flow]]"
created: 2025-02-08
---

# ECSシステム設計

> [!info] 概要
> Phyllotaxis PlannerのECSアーキテクチャにおけるシステム設計の詳細を説明します。

## システム設計原則

### 🎯 基本原則

> [!warning] ロジックのみ実装
> システムはロジックのみを実装し、状態やデータは一切持たない

```typescript
// ✅ 正しいシステム設計
class PhyllotaxisSystem {
  readonly name = 'PhyllotaxisSystem';
  readonly requiredComponents = ['position', 'text'];
  
  update(entities: EntityId[], world: World, deltaTime: number): void {
    // ロジックのみ実装
  }
}

// ❌ 間違ったシステム設計
class BadSystem {
  private data: any[] = []; // 状態を持ってはいけない
}
```

### ⚙️ システム基底インターフェース

```typescript
// ecs/core/System.ts
interface System {
  readonly name: string;
  readonly requiredComponents: ComponentType[];
  readonly priority: number;
  
  update(entities: EntityId[], world: World, deltaTime: number): void;
}

abstract class BaseSystem implements System {
  abstract readonly name: string;
  abstract readonly requiredComponents: ComponentType[];
  readonly priority: number = 0;
  
  constructor(priority: number = 0) {
    this.priority = priority;
  }
  
  abstract update(entities: EntityId[], world: World, deltaTime: number): void;
  
  // ヘルパーメソッド
  protected filterEntities(entities: EntityId[], world: World): EntityId[] {
    return entities.filter(entityId => 
      this.requiredComponents.every(type => 
        world.hasComponent(entityId, type)
      )
    );
  }
}
```## 主要システ
ム設計

### 🌀 PhyllotaxisSystem

> [!note] 責務
> フィロタキシス配置計算とエンティティ位置の更新

```typescript
class PhyllotaxisSystem extends BaseSystem {
  readonly name = 'PhyllotaxisSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];
  
  private config: PhyllotaxisConfig;
  private eventBus: EventBus;
  
  constructor(config: PhyllotaxisConfig, eventBus: EventBus) {
    super(1); // 高優先度
    this.config = config;
    this.eventBus = eventBus;
  }
  
  update(entities: EntityId[], world: World, deltaTime: number): void {
    const processableEntities = this.filterEntities(entities, world);
    
    // 中心テーマを除外
    const ideaEntities = processableEntities.filter(entityId => {
      const textComp = world.getComponent<ITextComponent>(entityId, ComponentTypes.TEXT);
      return textComp && textComp.fontSize <= 16; // 中心テーマは大きなフォント
    });
    
    ideaEntities.forEach((entityId, index) => {
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

### 🎬 AnimationSystem

> [!note] 責務
> エンティティのアニメーション状態管理と更新

```typescript
class AnimationSystem extends BaseSystem {
  readonly name = 'AnimationSystem';
  readonly requiredComponents = [ComponentTypes.ANIMATION];
  
  constructor(eventBus: EventBus) {
    super(2); // 中優先度
    this.eventBus = eventBus;
  }
  
  update(entities: EntityId[], world: World, deltaTime: number): void {
    const animatingEntities = this.filterEntities(entities, world)
      .filter(entityId => {
        const animation = world.getComponent<IAnimationComponent>(entityId, ComponentTypes.ANIMATION);
        return animation?.isAnimating;
      });
    
    animatingEntities.forEach(entityId => {
      this.updateAnimation(entityId, world, deltaTime);
    });
  }
  
  private updateAnimation(entityId: EntityId, world: World, deltaTime: number): void {
    const animation = world.getComponent<IAnimationComponent>(entityId, ComponentTypes.ANIMATION);
    if (!animation || !animation.isAnimating) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - animation.startTime;
    const progress = Math.min(elapsed / animation.duration, 1);
    
    animation.progress = progress;
    
    if (progress >= 1) {
      this.completeAnimation(entityId, animation);
    } else {
      this.applyAnimationEffect(entityId, world, animation);
    }
  }
}
```

### 🎨 RenderSystem

> [!note] 責務
> エンティティのSVG描画とDOM更新

```typescript
class RenderSystem extends BaseSystem {
  readonly name = 'RenderSystem';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.VISUAL];
  
  private svgElement: SVGSVGElement;
  private entityElements: Map<EntityId, SVGGElement>;
  
  constructor(svgElement: SVGSVGElement) {
    super(3); // 低優先度（最後に実行）
    this.svgElement = svgElement;
    this.entityElements = new Map();
  }
  
  update(entities: EntityId[], world: World, deltaTime: number): void {
    const renderableEntities = this.filterEntities(entities, world);
    
    renderableEntities.forEach(entityId => {
      this.renderEntity(entityId, world);
    });
    
    this.cleanupRemovedEntities(entities);
  }
  
  private renderEntity(entityId: EntityId, world: World): void {
    const position = world.getComponent<IPositionComponent>(entityId, ComponentTypes.POSITION);
    const visual = world.getComponent<IVisualComponent>(entityId, ComponentTypes.VISUAL);
    
    if (!position || !visual || !visual.visible) return;
    
    let groupElement = this.entityElements.get(entityId);
    
    if (!groupElement) {
      groupElement = this.createEntityElement(entityId, world);
      this.entityElements.set(entityId, groupElement);
      this.svgElement.appendChild(groupElement);
    }
    
    this.updateEntityElement(groupElement, entityId, world);
  }
}
```