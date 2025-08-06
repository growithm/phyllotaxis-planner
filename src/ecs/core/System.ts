/**
 * ECSシステム基底インターフェースと基底クラス
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, IComponent } from '@/ecs/core/Component';
import { EventBus } from '@/events/core/EventBus';
import { SystemEvents } from '@/events/types/EventTypes';

// World インターフェースの前方宣言
export interface IWorld {
  // エンティティ管理
  createEntity(): EntityId;
  destroyEntity(entityId: EntityId): boolean;
  hasEntity(entityId: EntityId): boolean;
  getAllEntities(): EntityId[];
  
  // コンポーネント管理
  hasComponent(entityId: EntityId, type: ComponentType): boolean;
  getComponent<T extends import('@/ecs/core/Component').IComponent>(entityId: EntityId, type: ComponentType): T | undefined;
  addComponent<T extends import('@/ecs/core/Component').IComponent>(entityId: EntityId, component: T): void;
  removeComponent(entityId: EntityId, type: ComponentType): void;
  
  // バージョン管理
  getVersion?(): number;
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
 * 3フェーズ実行モデル（フィルタリング → ロジック実行 → イベント発火）を実装
 */
export abstract class BaseSystem implements ISystem {
  abstract readonly name: string;
  abstract readonly requiredComponents: ComponentType[];
  readonly priority: number;
  protected eventBus?: EventBus;

  constructor(priority: number = 0, eventBus?: EventBus) {
    this.priority = priority;
    this.eventBus = eventBus;
  }

  /**
   * システム更新メソッド（3フェーズ実行モデル）
   */
  update(entities: EntityId[], world: IWorld, deltaTime: number): void {
    // Phase 1: エンティティフィルタリング
    const processableEntities = this.filterEntities(entities, world);
    
    if (processableEntities.length === 0) {
      return; // 処理対象がない場合は早期リターン
    }
    
    // Phase 2: ロジック実行
    this.processEntities(processableEntities, world, deltaTime);
    
    // Phase 3: イベント発火
    this.emitEvents(processableEntities, world, deltaTime);
  }

  /**
   * Phase 1: 必要なコンポーネントを持つエンティティのみをフィルタリング
   */
  protected filterEntities(entities: EntityId[], world: IWorld): EntityId[] {
    return entities.filter(entityId => 
      this.requiredComponents.every(type => 
        world.hasComponent(entityId, type)
      )
    );
  }

  /**
   * Phase 2: ビジネスロジック実行（サブクラスで実装）
   */
  protected abstract processEntities(entities: EntityId[], world: IWorld, deltaTime: number): void;

  /**
   * Phase 3: イベント発火（サブクラスでオーバーライド可能）
   */
  protected emitEvents(entities: EntityId[], world: IWorld, deltaTime: number): void {
    if (!this.eventBus) return;

    // システム処理完了イベント
    this.eventBus.emit(SystemEvents.SYSTEM_READY, {
      systemName: this.name,
      processedEntities: entities.length,
      timestamp: Date.now()
    });
  }

  /**
   * 型安全なシステムイベント発火
   */
  protected emitSystemEvent<T>(event: string, data: T): void {
    if (this.eventBus) {
      this.eventBus.emit(event, data);
    }
  }

  /**
   * 必要なコンポーネントを取得するヘルパーメソッド
   */
  protected getRequiredComponents(entityId: EntityId, world: IWorld): Map<ComponentType, IComponent> {
    const components = new Map<ComponentType, IComponent>();
    
    this.requiredComponents.forEach(type => {
      const component = world.getComponent(entityId, type);
      if (component) {
        components.set(type, component);
      }
    });
    
    return components;
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