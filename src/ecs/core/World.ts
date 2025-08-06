/**
 * ECSの中央管理システム - World実装
 */

import { EntityId, EntityPool, EntityPoolStats } from '@/ecs/core/Entity';
import { ComponentType, ComponentTypes, IComponent } from '@/ecs/core/Component';
import { ISystem, IWorld, SystemStats } from '@/ecs/core/System';
import { ComponentManager, ComponentStats } from '@/ecs/core/ComponentManager';
import { SystemManager } from '@/ecs/core/SystemManager';
import { LifecycleManager } from '@/ecs/core/LifecycleManager';
import { EventBus } from '@/events/core/EventBus';
import { SystemEvents, LifecycleEvents, IdeaEvents, UIEvents } from '@/events/types/EventTypes';
import { QuerySystem, QuerySystemOptions, QuerySystemStats } from '@/ecs/query/QuerySystem';
import { QueryFilter, AdvancedQueryFilter, QueryResult } from '@/ecs/query/types/QueryTypes';
import { QueryBuilder } from '@/ecs/query/QueryBuilder';

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
  private lifecycleManager: LifecycleManager;

  // クエリシステム
  private querySystem: QuerySystem;

  // バージョン管理（キャッシュ無効化用）
  private version: number = 0;

  constructor(eventBus: EventBus, querySystemOptions?: QuerySystemOptions) {
    this.entityPool = new EntityPool();
    this.entities = new Set();
    this.componentIndex = new Map();
    this.componentManager = new ComponentManager();
    this.systemManager = new SystemManager(eventBus);
    this.eventBus = eventBus;
    this.lifecycleManager = new LifecycleManager(eventBus, {
      enableValidation: true,
      enableStateTracking: true,
      enablePerformanceMonitoring: process.env.NODE_ENV === 'development'
    });

    this.initializeComponentStorage();
    this.setupEventListeners();
    
    // QuerySystemを初期化（Worldが完全に初期化された後）
    this.querySystem = new QuerySystem(this, querySystemOptions);
  }

  /**
   * イベントリスナーをセットアップ
   */
  private setupEventListeners(): void {
    this.setupSystemEventListeners();
    this.setupIdeaEventListeners();
    this.setupThemeEventListeners();
  }

  /**
   * システム間イベント連携のセットアップ
   */
  private setupSystemEventListeners(): void {
    // システム処理完了イベントの監視
    this.eventBus.on(SystemEvents.SYSTEM_READY, (data) => {
      // システム処理統計の更新
      if (process.env.NODE_ENV === 'development') {
        console.log(`[World] System ${data.systemName} processed ${data.processedEntities} entities`);
      }
    });

    // システムエラーイベントの監視
    this.eventBus.on(SystemEvents.ERROR_OCCURRED, (data) => {
      console.error(`[World] System error from ${data.source}:`, data.message);
      
      // 重要なエラーの場合は追加処理
      if (!data.recoverable) {
        this.handleCriticalSystemError(data);
      }
    });

    // 位置計算完了 → アニメーション開始の連携
    this.eventBus.on(SystemEvents.POSITION_CALCULATED, (data) => {
      // アニメーション開始イベントを発火
      this.eventBus.emit(SystemEvents.ANIMATION_START, {
        entityId: data.entityId,
        animationType: 'fadeIn',
        duration: 600,
        easing: 'ease-out'
      });
    });

    // アニメーション開始 → 描画要求の連携
    this.eventBus.on(SystemEvents.ANIMATION_START, (data) => {
      // 描画要求イベントを発火
      this.eventBus.emit(SystemEvents.RENDER_REQUESTED, {
        entityId: data.entityId,
        priority: 'high',
        timestamp: new Date()
      });
    });
  }

  /**
   * アイデア関連イベントのセットアップ
   */
  private setupIdeaEventListeners(): void {
    // アイデア追加イベント
    this.eventBus.on(IdeaEvents.IDEA_ADDED, (data) => {
      this.handleIdeaAdded(data);
    });

    // アイデア削除イベント
    this.eventBus.on(IdeaEvents.IDEA_REMOVED, (data) => {
      this.handleIdeaRemoved(data);
    });

    // アイデア更新イベント
    this.eventBus.on(IdeaEvents.IDEA_UPDATED, (data) => {
      this.handleIdeaUpdated(data);
    });
  }

  /**
   * テーマ関連イベントのセットアップ
   */
  private setupThemeEventListeners(): void {
    // テーマ変更イベント
    this.eventBus.on(IdeaEvents.THEME_CHANGED, (data) => {
      this.handleThemeChanged(data);
    });
  }

  /**
   * 重要なシステムエラーの処理
   */
  private handleCriticalSystemError(errorData: any): void {
    // システム停止
    this.stopSystems();
    
    // エラー状態の記録
    console.error('[World] Critical system error detected, systems stopped', errorData);
    
    // 外部への通知（UI層など）
    this.eventBus.emit(UIEvents.MODAL_OPENED, {
      modalId: 'system-error',
      timestamp: new Date()
    });
  }

  /**
   * アイデア追加の処理
   */
  private handleIdeaAdded(data: any): void {
    try {
      // エンティティを作成（将来的にEntityFactoryを使用）
      const entityId = this.createEntity();
      
      // 基本コンポーネントを追加（将来的にブループリントを使用）
      // 現在は基盤のみ実装
      console.log(`[World] Idea added: ${data.text} (Entity: ${entityId})`);
      
    } catch (error) {
      console.error('[World] Failed to handle idea addition:', error);
      this.eventBus.emit(SystemEvents.ERROR_OCCURRED, {
        source: 'World.handleIdeaAdded',
        message: `Failed to add idea: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : undefined,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * アイデア削除の処理
   */
  private handleIdeaRemoved(data: any): void {
    try {
      // エンティティを削除
      const removed = this.destroyEntity(data.id);
      
      if (removed) {
        console.log(`[World] Idea removed: ${data.id}`);
      } else {
        console.warn(`[World] Failed to remove idea: Entity ${data.id} not found`);
      }
      
    } catch (error) {
      console.error('[World] Failed to handle idea removal:', error);
      this.eventBus.emit(SystemEvents.ERROR_OCCURRED, {
        source: 'World.handleIdeaRemoved',
        message: `Failed to remove idea: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : undefined,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * アイデア更新の処理
   */
  private handleIdeaUpdated(data: any): void {
    try {
      // エンティティのテキストコンポーネントを更新（将来的に実装）
      console.log(`[World] Idea updated: ${data.id} from "${data.oldText}" to "${data.newText}"`);
      
    } catch (error) {
      console.error('[World] Failed to handle idea update:', error);
      this.eventBus.emit(SystemEvents.ERROR_OCCURRED, {
        source: 'World.handleIdeaUpdated',
        message: `Failed to update idea: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : undefined,
        recoverable: true,
        timestamp: new Date()
      });
    }
  }

  /**
   * テーマ変更の処理
   */
  private handleThemeChanged(data: any): void {
    try {
      // 中心テーマエンティティを更新（将来的に実装）
      console.log(`[World] Theme changed from "${data.oldTheme}" to "${data.newTheme}"`);
      
      // 全体の再描画要求
      this.eventBus.emit(SystemEvents.RENDER_REQUESTED, {
        priority: 'normal',
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('[World] Failed to handle theme change:', error);
      this.eventBus.emit(SystemEvents.ERROR_OCCURRED, {
        source: 'World.handleThemeChanged',
        message: `Failed to change theme: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : undefined,
        recoverable: true,
        timestamp: new Date()
      });
    }
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

    // ライフサイクルイベント発火
    this.eventBus.emit(LifecycleEvents.COMPONENT_ADDED, {
      entityId,
      timestamp: Date.now(),
      componentType: component.type,
      newValue: component
    });
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
    // 削除前にコンポーネントの値を取得
    const oldComponent = this.componentManager.getComponent(entityId, type);
    
    const removed = this.componentManager.removeComponent(entityId, type);
    
    if (removed) {
      // インデックスを更新
      const entityComponents = this.componentIndex.get(entityId);
      if (entityComponents) {
        entityComponents.delete(type);
      }
      
      this.incrementVersion();

      // ライフサイクルイベント発火
      this.eventBus.emit(LifecycleEvents.COMPONENT_REMOVED, {
        entityId,
        timestamp: Date.now(),
        componentType: type,
        oldValue: oldComponent
      });
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

  // ===== QuerySystem統合 =====

  /**
   * 基本クエリを実行
   */
  query(filter: QueryFilter): QueryResult {
    return this.querySystem.query(filter);
  }

  /**
   * 高度なクエリを実行
   */
  queryAdvanced(filter: AdvancedQueryFilter): QueryResult {
    return this.querySystem.queryAdvanced(filter);
  }

  /**
   * QueryBuilderを作成
   */
  queryBuilder(): QueryBuilder {
    return this.querySystem.createBuilder();
  }

  /**
   * クエリキャッシュを無効化
   */
  invalidateQueryCache(): void {
    this.querySystem.invalidateCache();
  }

  /**
   * QuerySystem統計を取得
   */
  getQuerySystemStats(): QuerySystemStats {
    return this.querySystem.getStats();
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
    this.lifecycleManager.cleanup();
    this.querySystem.cleanup();
    this.version = 0;
  }

  /**
   * LifecycleManagerを取得（テスト用）
   */
  getLifecycleManager(): LifecycleManager {
    return this.lifecycleManager;
  }
}