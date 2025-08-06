/**
 * エンティティインデックス管理
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, ComponentTypes } from '@/ecs/core/Component';
import { IWorld } from '@/ecs/core/System';
import { SpatialQuery } from './types/QueryTypes';
import { SpatialIndex } from './SpatialIndex';

/**
 * インデックス設定オプション
 */
export interface IndexOptions {
  enableSpatialIndex?: boolean;
  enableCompositeIndex?: boolean;
  spatialBounds?: { x: number; y: number; width: number; height: number };
}

/**
 * インデックス統計情報
 */
export interface IndexStats {
  version: number;
  componentIndexSize: number;
  compositeIndexSize: number;
  spatialIndexSize: number;
  totalIndexedEntities: number;
  syncStatus: boolean;
}

/**
 * エンティティインデックス管理クラス
 */
export class EntityIndex {
  private world: IWorld;
  private options: IndexOptions;
  
  // コンポーネント別インデックス
  private componentIndex: Map<ComponentType, Set<EntityId>>;
  
  // 複合インデックス（よく使われる組み合わせ）
  private compositeIndex: Map<string, Set<EntityId>>;
  
  // 空間インデックス（位置ベース）
  private spatialIndex: SpatialIndex | null = null;
  
  // バージョン管理
  private version: number = 0;
  private lastWorldVersion: number = 0;

  constructor(world: IWorld, options: IndexOptions = {}) {
    this.world = world;
    this.options = {
      enableSpatialIndex: true,
      enableCompositeIndex: true,
      spatialBounds: { x: 0, y: 0, width: 1000, height: 1000 },
      ...options
    };
    
    this.componentIndex = new Map();
    this.compositeIndex = new Map();
    
    if (this.options.enableSpatialIndex) {
      this.spatialIndex = new SpatialIndex(this.options.spatialBounds);
    }
    
    this.initializeIndexes();
    this.setupUpdateListeners();
  }

  /**
   * インデックス初期化
   */
  private initializeIndexes(): void {
    // 全エンティティをスキャンしてインデックスを構築
    const entities = this.world.getAllEntities();
    
    entities.forEach(entityId => {
      this.addEntityToIndex(entityId);
    });
    
    this.lastWorldVersion = this.world.getVersion?.() || 0;
  }

  /**
   * エンティティをインデックスに追加
   */
  private addEntityToIndex(entityId: EntityId): void {
    // コンポーネント別インデックス更新
    Object.values(ComponentTypes).forEach(componentType => {
      if (this.world.hasComponent(entityId, componentType)) {
        this.addToComponentIndex(componentType, entityId);
      }
    });

    // 空間インデックス更新
    if (this.spatialIndex) {
      this.updateSpatialIndex(entityId);
    }
    
    // 複合インデックス更新
    if (this.options.enableCompositeIndex) {
      this.updateCompositeIndexes(entityId);
    }
  }

  /**
   * エンティティをインデックスから削除
   */
  private removeEntityFromIndex(entityId: EntityId): void {
    // 全インデックスから削除
    this.componentIndex.forEach(entitySet => {
      entitySet.delete(entityId);
    });
    
    this.compositeIndex.forEach(entitySet => {
      entitySet.delete(entityId);
    });
    
    if (this.spatialIndex) {
      this.spatialIndex.remove(entityId);
    }
  }

  /**
   * コンポーネント別インデックス更新
   */
  private addToComponentIndex(componentType: ComponentType, entityId: EntityId): void {
    if (!this.componentIndex.has(componentType)) {
      this.componentIndex.set(componentType, new Set());
    }
    this.componentIndex.get(componentType)!.add(entityId);
  }

  /**
   * 空間インデックス更新
   */
  private updateSpatialIndex(entityId: EntityId): void {
    if (!this.spatialIndex) return;

    const positionComponent = this.world.getComponent(entityId, ComponentTypes.POSITION);
    if (positionComponent && 'x' in positionComponent && 'y' in positionComponent) {
      const position = positionComponent as { x: number; y: number };
      this.spatialIndex.update(entityId, position.x, position.y);
    }
  }

  /**
   * 複合インデックス更新
   */
  private updateCompositeIndexes(entityId: EntityId): void {
    // よく使われる組み合わせのインデックスを事前計算
    const commonCombinations = [
      [ComponentTypes.POSITION, ComponentTypes.TEXT],
      [ComponentTypes.POSITION, ComponentTypes.VISUAL],
      [ComponentTypes.TEXT, ComponentTypes.VISUAL],
      [ComponentTypes.POSITION, ComponentTypes.TEXT, ComponentTypes.VISUAL]
    ];

    commonCombinations.forEach(combination => {
      if (combination.every(type => this.world.hasComponent(entityId, type))) {
        const key = combination.sort().join('|');
        if (!this.compositeIndex.has(key)) {
          this.compositeIndex.set(key, new Set());
        }
        this.compositeIndex.get(key)!.add(entityId);
      }
    });
  }

  /**
   * インデックス更新リスナー設定
   */
  private setupUpdateListeners(): void {
    // World変更監視は後で実装
    // 現在はforceUpdate()を使用してインデックスを更新
  }

  /**
   * インデックス同期チェック
   */
  checkSync(): boolean {
    const currentWorldVersion = this.world.getVersion?.() || 0;
    return this.lastWorldVersion === currentWorldVersion;
  }

  /**
   * インデックス強制更新
   */
  forceUpdate(): void {
    this.componentIndex.clear();
    this.compositeIndex.clear();
    if (this.spatialIndex) {
      this.spatialIndex.clear();
    }
    this.initializeIndexes();
    this.version++;
  }

  /**
   * インデックスを最新状態に同期
   */
  syncWithWorld(): void {
    const currentWorldVersion = this.world.getVersion?.() || 0;
    if (this.lastWorldVersion !== currentWorldVersion) {
      this.forceUpdate();
    }
  }

  /**
   * コンポーネント別エンティティ取得
   */
  getEntitiesWithComponent(componentType: ComponentType): Set<EntityId> {
    return this.componentIndex.get(componentType) || new Set();
  }

  /**
   * 複合インデックスからエンティティ取得
   */
  getEntitiesWithComponents(componentTypes: ComponentType[]): Set<EntityId> {
    const key = componentTypes.sort().join('|');
    const compositeResult = this.compositeIndex.get(key);
    
    if (compositeResult) {
      return compositeResult;
    }

    // 複合インデックスにない場合は交集合を計算
    if (componentTypes.length === 0) {
      return new Set();
    }

    let result = this.getEntitiesWithComponent(componentTypes[0]);
    
    for (let i = 1; i < componentTypes.length; i++) {
      const componentEntities = this.getEntitiesWithComponent(componentTypes[i]);
      result = new Set([...result].filter(entityId => componentEntities.has(entityId)));
    }

    return result;
  }

  /**
   * 空間クエリ
   */
  getEntitiesInArea(query: SpatialQuery): Set<EntityId> {
    if (!this.spatialIndex) {
      return new Set();
    }
    return this.spatialIndex.query(query);
  }

  /**
   * インデックス統計
   */
  getIndexStats(): IndexStats {
    return {
      version: this.version,
      componentIndexSize: this.componentIndex.size,
      compositeIndexSize: this.compositeIndex.size,
      spatialIndexSize: this.spatialIndex?.size() || 0,
      totalIndexedEntities: Array.from(this.componentIndex.values())
        .reduce((total, set) => total + set.size, 0),
      syncStatus: this.checkSync()
    };
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.componentIndex.clear();
    this.compositeIndex.clear();
    if (this.spatialIndex) {
      this.spatialIndex.clear();
    }
  }
}