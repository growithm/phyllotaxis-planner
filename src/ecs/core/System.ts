/**
 * ECSシステム基底インターフェースと基底クラス
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType } from '@/ecs/core/Component';

// World インターフェースの前方宣言
export interface IWorld {
  hasComponent(entityId: EntityId, type: ComponentType): boolean;
  getComponent<T extends import('@/ecs/core/Component').IComponent>(entityId: EntityId, type: ComponentType): T | undefined;
  addComponent<T extends import('@/ecs/core/Component').IComponent>(entityId: EntityId, component: T): void;
  removeComponent(entityId: EntityId, type: ComponentType): void;
  getAllEntities(): EntityId[];
}

/**
 * システム基底インターフェース
 */
export interface ISystem {
  readonly name: string;
  readonly requiredComponents: ComponentType[];
  readonly priority: number;
  
  update(entities: EntityId[], world: IWorld, deltaTime: number): void;
}

/**
 * システム基底抽象クラス
 */
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

/**
 * システム統計情報
 */
export interface SystemStats {
  name: string;
  priority: number;
  requiredComponents: ComponentType[];
  processableEntities: number;
  lastExecutionTime?: number;
}