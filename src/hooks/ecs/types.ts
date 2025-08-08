/**
 * React統合の型定義
 */

import type { World, PerformanceStats } from '@/ecs/core/World';
import type { EventBus } from '@/events/core/EventBus';
import type { EntityId } from '@/ecs/core/Entity';
import type { IComponent, ComponentType } from '@/ecs/core/Component';
import type { QueryFilter } from '@/ecs/query/types/QueryTypes';
import type { StateSynchronizer } from './StateSynchronizer';
import type { BatchUpdater } from './BatchUpdater';

// ECS Context
export interface ECSContext {
  world: World;
  eventBus: EventBus;
  stateSynchronizer: StateSynchronizer;
  batchUpdater: BatchUpdater;
}

// World Stats
export interface WorldStats {
  entityCount: number;
  componentCount: number;
  systemCount: number;
  version: number;
  memoryUsage: number;
}

// useWorld Hook
export interface UseWorldOptions {
  // 自動同期設定
  autoSync?: boolean;
  syncInterval?: number;

  // バッチ更新設定
  enableBatching?: boolean;
  batchDelay?: number;

  // パフォーマンス設定
  enableMemoization?: boolean;
  memoizationTTL?: number;

  // デバッグ設定
  enableDebug?: boolean;
  debugLevel?: 'info' | 'warn' | 'error';
}

export interface UseWorldResult {
  // World インスタンス
  world: World;

  // 基本統計
  stats: WorldStats;
  version: number;

  // エンティティ操作
  entities: EntityId[];
  createEntity: () => EntityId;
  destroyEntity: (entityId: EntityId) => boolean;

  // コンポーネント操作
  addComponent: <T extends IComponent>(
    entityId: EntityId,
    component: T
  ) => void;
  removeComponent: (
    entityId: EntityId,
    componentType: ComponentType
  ) => boolean;
  getComponent: <T extends IComponent>(
    entityId: EntityId,
    componentType: ComponentType
  ) => T | undefined;

  // クエリ操作
  query: (filter: QueryFilter) => EntityId[];

  // バッチ操作
  batchUpdate: (operations: () => void) => void;

  // 状態管理
  isLoading: boolean;
  error: Error | null;

  // パフォーマンス
  performanceStats: PerformanceStats;
}

// useEntity Hook
export interface UseEntityOptions {
  // 自動同期
  autoSync?: boolean;

  // コンポーネントフィルター
  watchComponents?: ComponentType[];

  // パフォーマンス
  enableMemoization?: boolean;
}

export interface UseEntityResult {
  // エンティティ情報
  entityId: EntityId;
  exists: boolean;

  // コンポーネント管理
  components: Map<ComponentType, IComponent>;
  hasComponent: (componentType: ComponentType) => boolean;
  getComponent: <T extends IComponent>(
    componentType: ComponentType
  ) => T | undefined;
  addComponent: <T extends IComponent>(component: T) => void;
  removeComponent: (componentType: ComponentType) => boolean;

  // 状態
  isLoading: boolean;
  error: Error | null;
}

// useComponent Hook
export interface UseComponentOptions<T extends IComponent> {
  // デフォルト値
  defaultValue?: Partial<T>;

  // 自動作成
  autoCreate?: boolean;

  // 変更検知
  deepWatch?: boolean;

  // バリデーション
  validator?: (component: T) => boolean;
}

export interface UseComponentResult<T extends IComponent> {
  // コンポーネント値
  component: T | undefined;
  exists: boolean;

  // 操作
  update: (updates: Partial<T>) => void;
  replace: (newComponent: T) => void;
  remove: () => boolean;

  // 状態
  isLoading: boolean;
  error: Error | null;
}

// useQuery Hook
export interface UseQueryOptions {
  // 自動更新
  autoUpdate?: boolean;
  updateInterval?: number;

  // キャッシュ
  enableCache?: boolean;
  cacheKey?: string;

  // パフォーマンス
  debounceMs?: number;
  throttleMs?: number;

  // ページネーション
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export interface UseQueryResult {
  // 結果
  entities: EntityId[];
  totalCount: number;

  // 状態
  isLoading: boolean;
  error: Error | null;

  // 操作
  refetch: () => void;

  // メタデータ
  executionTime: number;
  fromCache: boolean;
}

// State Synchronizer
import { SyncEventTypes } from '@/events/types/EventTypes';

export interface SyncSubscriber {
  eventTypes: (typeof SyncEventTypes)[keyof typeof SyncEventTypes][];
  callback: (eventType: (typeof SyncEventTypes)[keyof typeof SyncEventTypes], data: Record<string, unknown>) => void;
}

export interface SyncOperation {
  type: (typeof SyncEventTypes)[keyof typeof SyncEventTypes];
  data: unknown;
  timestamp: number;
}

export interface SyncStats {
  subscriberCount: number;
  queueLength: number;
  isProcessing: boolean;
}

// Batch Updater
export interface BatchOperation {
  operation: () => void;
  timestamp: number;
}

export interface BatchUpdaterOptions {
  batchDelay?: number;
  maxBatchSize?: number;
}

// High-level Components
export interface EntityRendererProps {
  entityId: EntityId;
  children: (entity: UseEntityResult) => React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: React.ComponentType<{ error: Error; entityId: EntityId }>;
}

export interface QueryRendererProps {
  filter: QueryFilter;
  children: (result: UseQueryResult) => React.ReactNode;
  fallback?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorBoundary?: React.ComponentType<{ error: Error; filter: QueryFilter }>;
  options?: UseQueryOptions;
}

export interface VirtualizedEntityListProps {
  entities: EntityId[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (entityId: EntityId, index: number) => React.ReactNode;
}
