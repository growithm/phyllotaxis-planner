/**
 * ECSの中央管理システム - World実装
 */

import { EntityId, EntityPool, EntityPoolStats } from '@/ecs/core/Entity';
import { ComponentType, ComponentTypes, IComponent } from '@/ecs/core/Component';
import { ISystem, IWorld, SystemStats } from '@/ecs/core/System';
import { ComponentManager, ComponentStats } from '@/ecs/core/ComponentManager';
import { SystemManager } from '@/ecs/core/SystemManager';
import { EventBus } from '@/events/core/EventBus';
import { SystemEvents, LifecycleEvents } from '@/events/types/EventTypes';

/**
 * エンティティ統計情報
 */
export interface EntityStats {
  total: number;
  active: number;
  poolStats: EntityPoolStats;
}

/**
 * パフォーマンス統計情報
 */
export interface PerformanceStats {
  entityCount: number;
  componentCount: number;
  systemCount: number;
  version: number;
  memoryUsage: number;
}

/**
 * ECSの中央管理システム
 */
export class World implements IWorld {
  // エンティティ管理
  private entityPool: EntityPool;
  private entities: Set<EntityId>;
  private componentIndex: Map<EntityId, Set<ComponentType>>;

  // コンポーネント管理
  private componentManager: ComponentManager;

  // システム管理
  private systemManager: SystemManager;

  // イベント統合
  private eventBus: EventBus;

  // バージョン管理（キャッシュ無効化用）
  private version: number = 0;

  constructor(eventBus: EventBus) {
    this.entityPool = new EntityPool();
    this.entities = new Set();
    this.componentIndex = new Map();
    this.componentManager = new ComponentManager();
    this.systemManager = new SystemManager(eventBus);
    this.eventBus = eventBus;

    this.initializeComponentStorage();
    this.setupEventListeners();
  }

  /**
   * イベントリスナーをセットアップ
   */
  private setupEventListeners(): void {
    // 将来的にアイデア追加・削除イベントなどを処理
    // 現在は基盤のみ実装
  }

  /**
   * コンポーネントストレージを初期化
   */
  private initializeComponentStorage(): void {
    const componentTypes = Object.values(ComponentTypes);
    this.componentManager.initializeStorage(componentTypes);
  }

  // ===== エンティティ管理 =====

  /**
   * エンティティを作成
   */
  createEntity(): EntityId {
    const entityId = this.entityPool.acquire();
    this.entities.add(entityId);
    this.componentIndex.set(entityId, new Set());
    this.incrementVersion();

    // ライフサイクルイベント発火
    this.eventBus.emit(LifecycleEvents.AFTER_CREATE, {
      entityId,
      timestamp: Date.now()
    });

    return entityId;
  }

  /**
   * エンティティを削除
   */
  destroyEntity(entityId: EntityId): boolean {
    if (!this.entities.has(entityId)) {
      return false;
    }

    // 削除前イベント発火
    this.eventBus.emit(LifecycleEvents.BEFORE_DESTROY, {
      entityId,
      timestamp: Date.now()
    });

    // すべてのコンポーネントを削除
    const componentTypes = this.componentIndex.get(entityId) || new Set();
    componentTypes.forEach(type => {
      this.componentManager.removeComponent(entityId, type);
    });

    // エンティティを削除
    this.entities.delete(entityId);
    this.componentIndex.delete(entityId);
    this.entityPool.release(entityId);
    this.incrementVersion();

    // 削除後イベント発火
    this.eventBus.emit(LifecycleEvents.AFTER_DESTROY, {
      entityId,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * エンティティが存在するかチェック
   */
  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId);
  }

  /**
   * 全エンティティを取得
   */
  getAllEntities(): EntityId[] {
    return Array.from(this.entities);
  }

  // ===== コンポーネント管理 =====

  /**
   * エンティティにコンポーネントを追加
   */
  addComponent<T extends IComponent>(entityId: EntityId, component: T): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist`);
    }

    this.componentManager.addComponent(entityId, component);

    // インデックスを更新
    const entityComponents = this.componentIndex.get(entityId)!;
    entityComponents.add(component.type);

    this.incrementVersion();
  }

  /**
   * エンティティからコンポーネントを取得
   */
  getComponent<T extends IComponent>(entityId: EntityId, type: ComponentType): T | undefined {
    return this.componentManager.getComponent<T>(entityId, type);
  }

  /**
   * エンティティが指定されたコンポーネントを持っているかチェック
   */
  hasComponent(entityId: EntityId, type: ComponentType): boolean {
    const entityComponents = this.componentIndex.get(entityId);
    return entityComponents?.has(type) || false;
  }

  /**
   * エンティティからコンポーネントを削除
   */
  removeComponent(entityId: EntityId, type: ComponentType): boolean {
    const removed = this.componentManager.removeComponent(entityId, type);
    
    if (removed) {
      // インデックスを更新
      const entityComponents = this.componentIndex.get(entityId);
      if (entityComponents) {
        entityComponents.delete(type);
      }
      
      this.incrementVersion();
    }

    return removed;
  }

  /**
   * エンティティが複数のコンポーネントを持っているかチェック
   */
  hasComponents(entityId: EntityId, componentTypes: ComponentType[]): boolean {
    return componentTypes.every(type => this.hasComponent(entityId, type));
  }

  /**
   * 指定されたコンポーネントを持つエンティティを取得
   */
  getEntitiesWithComponents(...componentTypes: ComponentType[]): EntityId[] {
    return this.getAllEntities().filter(entityId =>
      componentTypes.every(type => this.hasComponent(entityId, type))
    );
  }

  /**
   * いずれかのコンポーネントを持つエンティティを取得
   */
  getEntitiesWithAnyComponent(...componentTypes: ComponentType[]): EntityId[] {
    return this.getAllEntities().filter(entityId =>
      componentTypes.some(type => this.hasComponent(entityId, type))
    );
  }

  /**
   * 指定されたコンポーネントを持たないエンティティを取得
   */
  getEntitiesWithoutComponents(...componentTypes: ComponentType[]): EntityId[] {
    return this.getAllEntities().filter(entityId =>
      !componentTypes.some(type => this.hasComponent(entityId, type))
    );
  }

  // ===== システム管理 =====

  /**
   * システムを追加
   */
  addSystem(system: ISystem): void {
    this.systemManager.addSystem(system);
  }

  /**
   * システムを削除
   */
  removeSystem(systemName: string): boolean {
    return this.systemManager.removeSystem(systemName);
  }

  /**
   * システムマネージャーを開始
   */
  startSystems(): void {
    this.systemManager.start();
  }

  /**
   * システムマネージャーを停止
   */
  stopSystems(): void {
    this.systemManager.stop();
  }

  /**
   * 全システムを更新
   */
  update(deltaTime: number): void {
    const entities = this.getAllEntities();
    this.systemManager.update(entities, this, deltaTime);
  }

  // ===== バージョン管理 =====

  /**
   * バージョンを取得
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * バージョンを増加
   */
  private incrementVersion(): void {
    this.version++;
  }

  /**
   * バッチ操作
   */
  batchUpdate(operations: () => void): void {
    const oldVersion = this.version;
    operations();
    
    // バッチ操作中にバージョンが変更された場合のみ通知
    if (this.version > oldVersion) {
      // イベント発火は後のタスクで実装
    }
  }

  // ===== 統計情報 =====

  /**
   * エンティティ統計を取得
   */
  getEntityStats(): EntityStats {
    return {
      total: this.entities.size,
      active: this.entities.size,
      poolStats: this.entityPool.getStats()
    };
  }

  /**
   * コンポーネント統計を取得
   */
  getComponentStats(): ComponentStats {
    return this.componentManager.getStats();
  }

  /**
   * システム統計を取得
   */
  getSystemStats(): SystemStats[] {
    return this.systemManager.getSystemStats(this);
  }

  /**
   * パフォーマンス統計を取得
   */
  getPerformanceStats(): PerformanceStats {
    const componentStats = this.getComponentStats();
    const componentCount = Object.values(componentStats).reduce((sum, count) => sum + count, 0);

    return {
      entityCount: this.entities.size,
      componentCount,
      systemCount: this.systemManager.getAllSystems().length,
      version: this.version,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * 概算メモリ使用量を計算
   */
  private estimateMemoryUsage(): number {
    const entitySize = 50; // bytes per entity ID
    const componentSize = 200; // bytes per component (average)

    const entitiesMemory = this.entities.size * entitySize;
    const componentStats = this.getComponentStats();
    const componentsMemory = Object.values(componentStats).reduce(
      (total, count) => total + count * componentSize, 0
    );

    return entitiesMemory + componentsMemory;
  }

  // ===== クリーンアップ =====

  /**
   * メモリ最適化
   */
  cleanup(): void {
    // 未使用のコンポーネントをクリーンアップ
    const activeEntities = new Set(this.entities);
    
    // ComponentManagerのクリーンアップは内部で処理される
    this.getAllEntities().forEach(entityId => {
      if (!activeEntities.has(entityId)) {
        this.componentManager.removeAllComponents(entityId);
      }
    });
  }

  /**
   * Worldをクリア（テスト用）
   */
  clear(): void {
    this.entities.clear();
    this.componentIndex.clear();
    this.entityPool.clear();
    this.componentManager.clear();
    this.systemManager.clear();
    this.version = 0;
  }
}