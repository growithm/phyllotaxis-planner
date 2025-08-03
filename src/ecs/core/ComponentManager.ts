/**
 * コンポーネントの格納と管理を行うマネージャー
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, IComponent } from '@/ecs/core/Component';

/**
 * コンポーネント統計情報
 */
export type ComponentStats = Record<ComponentType, number>;

/**
 * コンポーネントの格納と管理を行うマネージャー
 */
export class ComponentManager {
  // コンポーネントタイプ別にエンティティIDとコンポーネントのマップを保持
  private components: Map<ComponentType, Map<EntityId, IComponent>> = new Map();

  /**
   * コンポーネントストレージを初期化
   */
  initializeStorage(componentTypes: ComponentType[]): void {
    componentTypes.forEach(type => {
      if (!this.components.has(type)) {
        this.components.set(type, new Map());
      }
    });
  }

  /**
   * エンティティにコンポーネントを追加
   */
  addComponent<T extends IComponent>(entityId: EntityId, component: T): void {
    const componentType = component.type;
    
    if (!this.components.has(componentType)) {
      this.components.set(componentType, new Map());
    }

    const componentMap = this.components.get(componentType)!;
    componentMap.set(entityId, component);
  }

  /**
   * エンティティからコンポーネントを取得
   */
  getComponent<T extends IComponent>(entityId: EntityId, type: ComponentType): T | undefined {
    const componentMap = this.components.get(type);
    if (!componentMap) {
      return undefined;
    }

    return componentMap.get(entityId) as T | undefined;
  }

  /**
   * エンティティが指定されたコンポーネントを持っているかチェック
   */
  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    const componentMap = this.components.get(type);
    return componentMap ? componentMap.has(entityId) : false;
  }

  /**
   * エンティティからコンポーネントを削除
   */
  removeComponent(entityId: EntityId, type: ComponentType): boolean {
    const componentMap = this.components.get(type);
    if (!componentMap) {
      return false;
    }

    return componentMap.delete(entityId);
  }

  /**
   * エンティティのすべてのコンポーネントを削除
   */
  removeAllComponents(entityId: EntityId): void {
    for (const componentMap of this.components.values()) {
      componentMap.delete(entityId);
    }
  }

  /**
   * エンティティが持つすべてのコンポーネントタイプを取得
   */
  getComponentTypes(entityId: EntityId): ComponentType[] {
    const types: ComponentType[] = [];
    
    for (const [type, componentMap] of this.components.entries()) {
      if (componentMap.has(entityId)) {
        types.push(type);
      }
    }

    return types;
  }

  /**
   * 指定されたコンポーネントタイプを持つすべてのエンティティを取得
   */
  getEntitiesWithComponent(type: ComponentType): EntityId[] {
    const componentMap = this.components.get(type);
    return componentMap ? Array.from(componentMap.keys()) : [];
  }

  /**
   * 指定されたコンポーネントタイプのすべてのコンポーネントを取得
   */
  getAllComponents<T extends IComponent>(type: ComponentType): T[] {
    const componentMap = this.components.get(type);
    return componentMap ? Array.from(componentMap.values()) as T[] : [];
  }

  /**
   * 型別コンポーネント取得
   */
  getComponentsOfType<T extends IComponent>(componentType: ComponentType): Map<EntityId, T> {
    const componentStore = this.components.get(componentType);
    return (componentStore as Map<EntityId, T>) || new Map();
  }

  /**
   * エンティティの全コンポーネント取得
   */
  getEntityComponents(entityId: EntityId): Map<ComponentType, IComponent> {
    const result = new Map<ComponentType, IComponent>();
    
    for (const [type, componentMap] of this.components.entries()) {
      const component = componentMap.get(entityId);
      if (component) {
        result.set(type, component);
      }
    }

    return result;
  }

  /**
   * バッチコンポーネント更新
   */
  updateComponents<T extends IComponent>(
    componentType: ComponentType,
    updateFn: (component: T, entityId: EntityId) => void
  ): void {
    const componentStore = this.getComponentsOfType<T>(componentType);
    
    componentStore.forEach((component, entityId) => {
      updateFn(component, entityId);
    });
  }

  /**
   * コンポーネント統計を取得
   */
  getStats(): ComponentStats {
    const stats: ComponentStats = {} as ComponentStats;
    
    for (const [type, componentMap] of this.components.entries()) {
      stats[type] = componentMap.size;
    }

    return stats;
  }

  /**
   * すべてのコンポーネントをクリア（テスト用）
   */
  clear(): void {
    this.components.clear();
  }
}