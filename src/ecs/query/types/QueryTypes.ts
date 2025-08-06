/**
 * QuerySystem関連の型定義
 */

import { EntityId } from '@/ecs/core/Entity';
import { ComponentType, IComponent } from '@/ecs/core/Component';

/**
 * 基本クエリフィルター
 */
export interface QueryFilter {
  // 必須コンポーネント（AND条件）
  all?: ComponentType[];
  
  // いずれかのコンポーネント（OR条件）
  any?: ComponentType[];
  
  // 除外コンポーネント（NOT条件）
  none?: ComponentType[];
  
  // カスタム条件関数
  where?: (entityId: EntityId, components: Map<ComponentType, IComponent>) => boolean;
  
  // 結果制限
  limit?: number;
  offset?: number;
  
  // ソート条件
  orderBy?: QueryOrderBy[];
}

/**
 * 高度なクエリフィルター
 */
export interface AdvancedQueryFilter extends QueryFilter {
  // 空間クエリ（位置ベース）
  spatial?: SpatialQuery;
  
  // 範囲クエリ
  range?: RangeQuery[];
  
  // テキスト検索
  text?: TextQuery[];
  
  // 時間範囲
  timeRange?: TimeRangeQuery;
}

/**
 * ソート条件
 */
export interface QueryOrderBy {
  component: ComponentType;
  property: string;
  direction: 'asc' | 'desc';
}

/**
 * 空間クエリ
 */
export interface SpatialQuery {
  type: 'circle' | 'rectangle' | 'polygon';
  center?: { x: number; y: number };
  radius?: number;
  bounds?: { x1: number; y1: number; x2: number; y2: number };
  points?: { x: number; y: number }[];
}

/**
 * 範囲クエリ
 */
export interface RangeQuery {
  component: ComponentType;
  property: string;
  min?: number;
  max?: number;
}

/**
 * テキスト検索
 */
export interface TextQuery {
  component: ComponentType;
  property: string;
  text: string;
  mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  caseSensitive?: boolean;
}

/**
 * 時間範囲クエリ
 */
export interface TimeRangeQuery {
  component: ComponentType;
  property: string;
  from?: Date;
  to?: Date;
}

/**
 * クエリ結果
 */
export interface QueryResult {
  entities: EntityId[];
  totalCount: number;
  executionTime: number;
  fromCache: boolean;
  queryStats: QueryExecutionStats;
}

/**
 * クエリ実行統計
 */
export interface QueryExecutionStats {
  stepsExecuted: number;
  entitiesScanned: number;
  indexHits: number;
  cacheHit: boolean;
  optimizationApplied: string[];
}

/**
 * 最適化されたクエリ
 */
export interface OptimizedQuery {
  filter: QueryFilter;
  executionPlan: ExecutionStep[];
  estimatedCost: number;
}

/**
 * 実行ステップ
 */
export interface ExecutionStep {
  type: 'component-filter' | 'intersect' | 'spatial-filter' | 'custom-filter' | 'sort';
  component?: ComponentType;
  spatial?: SpatialQuery;
  orderBy?: QueryOrderBy[];
  estimatedResults: number;
}

/**
 * クエリパフォーマンス統計
 */
export interface QueryPerformanceStats {
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastResultCount: number;
}