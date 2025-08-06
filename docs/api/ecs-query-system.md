---
title: "QuerySystem API仕様"
type: api
category: ecs
tags: [api, ecs, query, typescript]
related:
  - "[[../architecture/ecs/query-system]]"
  - "[[ecs-performance-monitor]]"
  - "[[world-integration]]"
created: 2025-02-08
---

# QuerySystem API仕様

> [!info] 概要
> ECSアーキテクチャにおけるQuerySystemの完全なAPI仕様書です。

## 📋 目次

- [QuerySystem クラス](#querysystem-クラス)
- [QueryFilter インターフェース](#queryfilter-インターフェース)
- [QueryBuilder クラス](#querybuilder-クラス)
- [QueryResult インターフェース](#queryresult-インターフェース)
- [EntityIndex クラス](#entityindex-クラス)
- [SpatialIndex クラス](#spatialindex-クラス)
- [QueryCache クラス](#querycache-クラス)
- [QueryOptimizer クラス](#queryoptimizer-クラス)
- [型定義](#型定義)
- [使用例](#使用例)

## QuerySystem クラス

### コンストラクタ

```typescript
constructor(world: IWorld, options?: QuerySystemOptions)
```

**パラメータ:**
- `world: IWorld` - 対象となるWorldインスタンス
- `options?: QuerySystemOptions` - オプション設定

**例:**
```typescript
const querySystem = new QuerySystem(world, {
  cacheOptions: { maxSize: 100, ttl: 5000 },
  indexOptions: { enableSpatialIndex: true },
  optimizationOptions: { enableOptimization: true }
});
```

### メソッド

#### query

```typescript
query(filter: QueryFilter): QueryResult
```

基本的なエンティティクエリを実行します。

**パラメータ:**
- `filter: QueryFilter` - クエリフィルター条件

**戻り値:**
- `QueryResult` - クエリ結果

**例:**
```typescript
const result = querySystem.query({
  all: [ComponentTypes.POSITION, ComponentTypes.TEXT],
  limit: 10
});

console.log(`Found ${result.entities.length} entities`);
console.log(`Execution time: ${result.executionTime}ms`);
```

#### queryAdvanced

```typescript
queryAdvanced(filter: AdvancedQueryFilter): QueryResult
```

高度なクエリ機能（空間検索、範囲検索など）を使用したクエリを実行します。

**パラメータ:**
- `filter: AdvancedQueryFilter` - 高度なクエリフィルター

**戻り値:**
- `QueryResult` - クエリ結果

**例:**
```typescript
const result = querySystem.queryAdvanced({
  all: [ComponentTypes.POSITION],
  spatial: {
    type: 'circle',
    center: { x: 100, y: 100 },
    radius: 50
  },
  range: [{
    component: ComponentTypes.TEXT,
    property: 'fontSize',
    min: 12,
    max: 24
  }]
});
```

#### createBuilder

```typescript
createBuilder(): QueryBuilder
```

流暢なインターフェースでクエリを構築するためのQueryBuilderを作成します。

**戻り値:**
- `QueryBuilder` - クエリビルダーインスタンス

**例:**
```typescript
const result = querySystem.createBuilder()
  .withComponents(ComponentTypes.POSITION, ComponentTypes.TEXT)
  .withinCircle({ x: 100, y: 100 }, 50)
  .orderBy(ComponentTypes.TEXT, 'content', 'asc')
  .limit(10)
  .execute();
```

#### invalidateCache

```typescript
invalidateCache(): void
```

クエリキャッシュを無効化します。

**例:**
```typescript
querySystem.invalidateCache();
```

#### getStats

```typescript
getStats(): QuerySystemStats
```

QuerySystemの統計情報を取得します。

**戻り値:**
- `QuerySystemStats` - 統計情報

**例:**
```typescript
const stats = querySystem.getStats();
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
console.log(`Total queries: ${stats.totalQueries}`);
```

#### updateSettings

```typescript
updateSettings(options: Partial<QuerySystemOptions>): void
```

QuerySystemの設定を更新します。

**パラメータ:**
- `options: Partial<QuerySystemOptions>` - 更新する設定

**例:**
```typescript
querySystem.updateSettings({
  cacheOptions: { maxSize: 200 },
  optimizationOptions: { enableOptimization: false }
});
```

## QueryFilter インターフェース

基本的なクエリフィルター条件を定義します。

```typescript
interface QueryFilter {
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
```

### プロパティ詳細

#### all
- **型:** `ComponentType[]`
- **説明:** 指定されたすべてのコンポーネントを持つエンティティを検索（AND条件）
- **例:** `[ComponentTypes.POSITION, ComponentTypes.TEXT]`

#### any
- **型:** `ComponentType[]`
- **説明:** 指定されたいずれかのコンポーネントを持つエンティティを検索（OR条件）
- **例:** `[ComponentTypes.VISUAL, ComponentTypes.ANIMATION]`

#### none
- **型:** `ComponentType[]`
- **説明:** 指定されたコンポーネントを持たないエンティティを検索（NOT条件）
- **例:** `[ComponentTypes.ANIMATION]`

#### where
- **型:** `(entityId: EntityId, components: Map<ComponentType, IComponent>) => boolean`
- **説明:** カスタム条件関数
- **例:**
```typescript
where: (entityId, components) => {
  const text = components.get(ComponentTypes.TEXT) as ITextComponent;
  return text && text.content.includes('important');
}
```

#### limit
- **型:** `number`
- **説明:** 結果の最大数
- **例:** `10`

#### offset
- **型:** `number`
- **説明:** 結果のオフセット（ページネーション用）
- **例:** `20`

#### orderBy
- **型:** `QueryOrderBy[]`
- **説明:** ソート条件の配列
- **例:**
```typescript
[{
  component: ComponentTypes.TEXT,
  property: 'content',
  direction: 'asc'
}]
```

## AdvancedQueryFilter インターフェース

高度なクエリ機能を含むフィルター条件を定義します。

```typescript
interface AdvancedQueryFilter extends QueryFilter {
  // 空間クエリ（位置ベース）
  spatial?: SpatialQuery;
  
  // 範囲クエリ
  range?: RangeQuery[];
  
  // テキスト検索
  text?: TextQuery[];
  
  // 時間範囲
  timeRange?: TimeRangeQuery;
}
```

### 空間クエリ (SpatialQuery)

```typescript
interface SpatialQuery {
  type: 'circle' | 'rectangle' | 'polygon';
  center?: { x: number; y: number };
  radius?: number;
  bounds?: { x1: number; y1: number; x2: number; y2: number };
  points?: { x: number; y: number }[];
}
```

**使用例:**
```typescript
// 円形範囲検索
spatial: {
  type: 'circle',
  center: { x: 100, y: 100 },
  radius: 50
}

// 矩形範囲検索
spatial: {
  type: 'rectangle',
  bounds: { x1: 0, y1: 0, x2: 200, y2: 200 }
}
```

### 範囲クエリ (RangeQuery)

```typescript
interface RangeQuery {
  component: ComponentType;
  property: string;
  min?: number;
  max?: number;
}
```

**使用例:**
```typescript
range: [{
  component: ComponentTypes.TEXT,
  property: 'fontSize',
  min: 12,
  max: 24
}]
```

### テキスト検索 (TextQuery)

```typescript
interface TextQuery {
  component: ComponentType;
  property: string;
  text: string;
  mode: 'exact' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  caseSensitive?: boolean;
}
```

**使用例:**
```typescript
text: [{
  component: ComponentTypes.TEXT,
  property: 'content',
  text: 'important',
  mode: 'contains',
  caseSensitive: false
}]
```

## QueryBuilder クラス

流暢なインターフェースでクエリを構築するためのクラスです。

### メソッド

#### withComponents

```typescript
withComponents(...components: ComponentType[]): QueryBuilder
```

必須コンポーネントを指定します。

**パラメータ:**
- `...components: ComponentType[]` - 必須コンポーネント

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withComponents(ComponentTypes.POSITION, ComponentTypes.TEXT)
```

#### withAnyComponent

```typescript
withAnyComponent(...components: ComponentType[]): QueryBuilder
```

いずれかのコンポーネントを指定します。

**パラメータ:**
- `...components: ComponentType[]` - いずれかのコンポーネント

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withAnyComponent(ComponentTypes.VISUAL, ComponentTypes.ANIMATION)
```

#### withoutComponents

```typescript
withoutComponents(...components: ComponentType[]): QueryBuilder
```

除外するコンポーネントを指定します。

**パラメータ:**
- `...components: ComponentType[]` - 除外コンポーネント

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withoutComponents(ComponentTypes.ANIMATION)
```

#### where

```typescript
where(predicate: (entityId: EntityId, components: Map<ComponentType, IComponent>) => boolean): QueryBuilder
```

カスタム条件を追加します。

**パラメータ:**
- `predicate` - 条件関数

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.where((entityId, components) => {
  const text = components.get(ComponentTypes.TEXT) as ITextComponent;
  return text && text.content.length > 10;
})
```

#### withinCircle

```typescript
withinCircle(center: { x: number; y: number }, radius: number): QueryBuilder
```

円形範囲内のエンティティを検索します。

**パラメータ:**
- `center` - 中心座標
- `radius` - 半径

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withinCircle({ x: 100, y: 100 }, 50)
```

#### withinRectangle

```typescript
withinRectangle(bounds: { x1: number; y1: number; x2: number; y2: number }): QueryBuilder
```

矩形範囲内のエンティティを検索します。

**パラメータ:**
- `bounds` - 矩形の境界

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withinRectangle({ x1: 0, y1: 0, x2: 200, y2: 200 })
```

#### withRange

```typescript
withRange(component: ComponentType, property: string, min?: number, max?: number): QueryBuilder
```

範囲条件を追加します。

**パラメータ:**
- `component` - 対象コンポーネント
- `property` - 対象プロパティ
- `min?` - 最小値
- `max?` - 最大値

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withRange(ComponentTypes.TEXT, 'fontSize', 12, 24)
```

#### withText

```typescript
withText(component: ComponentType, property: string, text: string, mode?: TextQuery['mode']): QueryBuilder
```

テキスト検索条件を追加します。

**パラメータ:**
- `component` - 対象コンポーネント
- `property` - 対象プロパティ
- `text` - 検索テキスト
- `mode?` - 検索モード（デフォルト: 'contains'）

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.withText(ComponentTypes.TEXT, 'content', 'important', 'contains')
```

#### orderBy

```typescript
orderBy(component: ComponentType, property: string, direction?: 'asc' | 'desc'): QueryBuilder
```

ソート条件を指定します。

**パラメータ:**
- `component` - 対象コンポーネント
- `property` - 対象プロパティ
- `direction?` - ソート方向（デフォルト: 'asc'）

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.orderBy(ComponentTypes.TEXT, 'content', 'asc')
```

#### limit

```typescript
limit(count: number): QueryBuilder
```

結果数を制限します。

**パラメータ:**
- `count` - 最大結果数

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.limit(10)
```

#### offset

```typescript
offset(count: number): QueryBuilder
```

結果のオフセットを指定します。

**パラメータ:**
- `count` - オフセット数

**戻り値:**
- `QueryBuilder` - チェーン可能なビルダー

**例:**
```typescript
builder.offset(20)
```

#### execute

```typescript
execute(querySystem: QuerySystem): QueryResult
```

クエリを実行します。

**パラメータ:**
- `querySystem` - QuerySystemインスタンス

**戻り値:**
- `QueryResult` - クエリ結果

**例:**
```typescript
const result = builder.execute(querySystem);
```

#### build

```typescript
build(): QueryFilter
```

QueryFilterオブジェクトを構築します。

**戻り値:**
- `QueryFilter` - 構築されたフィルター

**例:**
```typescript
const filter = builder.build();
const result = querySystem.query(filter);
```

## QueryResult インターフェース

クエリ実行結果を表します。

```typescript
interface QueryResult {
  entities: EntityId[];
  totalCount: number;
  executionTime: number;
  fromCache: boolean;
  queryStats: QueryExecutionStats;
}
```

### プロパティ

#### entities
- **型:** `EntityId[]`
- **説明:** 検索結果のエンティティID配列

#### totalCount
- **型:** `number`
- **説明:** 総結果数（limitを適用する前の数）

#### executionTime
- **型:** `number`
- **説明:** クエリ実行時間（ミリ秒）

#### fromCache
- **型:** `boolean`
- **説明:** キャッシュから取得されたかどうか

#### queryStats
- **型:** `QueryExecutionStats`
- **説明:** クエリ実行統計

## QueryExecutionStats インターフェース

```typescript
interface QueryExecutionStats {
  stepsExecuted: number;
  entitiesScanned: number;
  indexHits: number;
  cacheHit: boolean;
  optimizationApplied: string[];
}
```

### プロパティ

#### stepsExecuted
- **型:** `number`
- **説明:** 実行されたクエリステップ数

#### entitiesScanned
- **型:** `number`
- **説明:** スキャンされたエンティティ数

#### indexHits
- **型:** `number`
- **説明:** インデックスヒット数

#### cacheHit
- **型:** `boolean`
- **説明:** キャッシュヒットしたかどうか

#### optimizationApplied
- **型:** `string[]`
- **説明:** 適用された最適化の配列

## EntityIndex クラス

エンティティのインデックス管理を行います。

### メソッド

#### getEntitiesWithComponent

```typescript
getEntitiesWithComponent(componentType: ComponentType): Set<EntityId>
```

指定されたコンポーネントを持つエンティティを取得します。

**パラメータ:**
- `componentType: ComponentType` - コンポーネントタイプ

**戻り値:**
- `Set<EntityId>` - エンティティIDのセット

#### getEntitiesWithComponents

```typescript
getEntitiesWithComponents(componentTypes: ComponentType[]): Set<EntityId>
```

指定されたすべてのコンポーネントを持つエンティティを取得します。

**パラメータ:**
- `componentTypes: ComponentType[]` - コンポーネントタイプの配列

**戻り値:**
- `Set<EntityId>` - エンティティIDのセット

#### getEntitiesInArea

```typescript
getEntitiesInArea(query: SpatialQuery): Set<EntityId>
```

空間クエリに一致するエンティティを取得します。

**パラメータ:**
- `query: SpatialQuery` - 空間クエリ

**戻り値:**
- `Set<EntityId>` - エンティティIDのセット

#### forceUpdate

```typescript
forceUpdate(): void
```

インデックスを強制的に更新します。

#### getIndexStats

```typescript
getIndexStats(): IndexStats
```

インデックスの統計情報を取得します。

**戻り値:**
- `IndexStats` - インデックス統計

## SpatialIndex クラス

空間インデックス（QuadTree）を管理します。

### メソッド

#### update

```typescript
update(entityId: EntityId, x: number, y: number): void
```

エンティティの位置を更新します。

**パラメータ:**
- `entityId: EntityId` - エンティティID
- `x: number` - X座標
- `y: number` - Y座標

#### remove

```typescript
remove(entityId: EntityId): void
```

エンティティを空間インデックスから削除します。

**パラメータ:**
- `entityId: EntityId` - エンティティID

#### query

```typescript
query(spatialQuery: SpatialQuery): Set<EntityId>
```

空間クエリを実行します。

**パラメータ:**
- `spatialQuery: SpatialQuery` - 空間クエリ

**戻り値:**
- `Set<EntityId>` - 該当するエンティティIDのセット

#### size

```typescript
size(): number
```

インデックスに登録されているエンティティ数を取得します。

**戻り値:**
- `number` - エンティティ数

#### clear

```typescript
clear(): void
```

空間インデックスをクリアします。

## QueryCache クラス

クエリ結果のキャッシュを管理します。

### メソッド

#### get

```typescript
get(queryKey: string): EntityId[] | null
```

キャッシュからクエリ結果を取得します。

**パラメータ:**
- `queryKey: string` - クエリキー

**戻り値:**
- `EntityId[] | null` - キャッシュされた結果またはnull

#### set

```typescript
set(queryKey: string, result: EntityId[]): void
```

クエリ結果をキャッシュに保存します。

**パラメータ:**
- `queryKey: string` - クエリキー
- `result: EntityId[]` - クエリ結果

#### delete

```typescript
delete(queryKey: string): void
```

指定されたキーのキャッシュを削除します。

**パラメータ:**
- `queryKey: string` - クエリキー

#### clear

```typescript
clear(): void
```

すべてのキャッシュをクリアします。

#### invalidate

```typescript
invalidate(): void
```

キャッシュを無効化します（clearと同じ）。

#### getStats

```typescript
getStats(): CacheStats
```

キャッシュの統計情報を取得します。

**戻り値:**
- `CacheStats` - キャッシュ統計

## QueryOptimizer クラス

クエリの最適化を行います。

### メソッド

#### optimize

```typescript
optimize(filter: QueryFilter, entityIndex: EntityIndex): OptimizedQuery
```

クエリを最適化します。

**パラメータ:**
- `filter: QueryFilter` - 元のクエリフィルター
- `entityIndex: EntityIndex` - エンティティインデックス

**戻り値:**
- `OptimizedQuery` - 最適化されたクエリ

#### recordQueryStats

```typescript
recordQueryStats(queryKey: string, executionTime: number, resultCount: number): void
```

クエリ統計を記録します。

**パラメータ:**
- `queryKey: string` - クエリキー
- `executionTime: number` - 実行時間
- `resultCount: number` - 結果数

#### getQueryStats

```typescript
getQueryStats(): Map<string, QueryPerformanceStats>
```

クエリ統計を取得します。

**戻り値:**
- `Map<string, QueryPerformanceStats>` - クエリ統計のマップ

## 型定義

### QuerySystemOptions

```typescript
interface QuerySystemOptions {
  // キャッシュ設定
  cacheOptions?: {
    maxSize?: number;
    ttl?: number;
    enabled?: boolean;
  };

  // インデックス設定
  indexOptions?: {
    enableSpatialIndex?: boolean;
    enableCompositeIndex?: boolean;
    spatialBounds?: { x: number; y: number; width: number; height: number };
  };

  // 最適化設定
  optimizationOptions?: {
    enableOptimization?: boolean;
    collectStats?: boolean;
    maxExecutionTime?: number;
  };

  // デバッグ設定
  debugOptions?: {
    enableLogging?: boolean;
    logSlowQueries?: boolean;
    slowQueryThreshold?: number;
  };
}
```

### QueryOrderBy

```typescript
interface QueryOrderBy {
  component: ComponentType;
  property: string;
  direction: 'asc' | 'desc';
}
```

### IndexStats

```typescript
interface IndexStats {
  version: number;
  componentIndexSize: number;
  compositeIndexSize: number;
  spatialIndexSize: number;
  totalIndexedEntities: number;
  syncStatus: boolean;
}
```

### CacheStats

```typescript
interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  maxSize: number;
  hitRate: number;
}
```

### OptimizedQuery

```typescript
interface OptimizedQuery {
  filter: QueryFilter;
  executionPlan: ExecutionStep[];
  estimatedCost: number;
}
```

### ExecutionStep

```typescript
interface ExecutionStep {
  type: 'component-filter' | 'intersect' | 'spatial-filter' | 'custom-filter' | 'sort';
  component?: ComponentType;
  spatial?: SpatialQuery;
  orderBy?: QueryOrderBy[];
  estimatedResults: number;
}
```

### QueryPerformanceStats

```typescript
interface QueryPerformanceStats {
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  lastResultCount: number;
}
```

### QuerySystemStats

```typescript
interface QuerySystemStats {
  totalQueries: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  indexStats: IndexStats;
  cacheStats: CacheStats;
}
```

## 使用例

### 基本的なクエリ

```typescript
// QuerySystemの初期化
const querySystem = new QuerySystem(world);

// 基本的なクエリ
const result = querySystem.query({
  all: [ComponentTypes.POSITION, ComponentTypes.TEXT],
  limit: 10
});

console.log(`Found ${result.entities.length} entities`);
```

### 高度なクエリ

```typescript
// 空間検索と範囲検索を組み合わせたクエリ
const result = querySystem.queryAdvanced({
  all: [ComponentTypes.POSITION, ComponentTypes.TEXT],
  spatial: {
    type: 'circle',
    center: { x: 100, y: 100 },
    radius: 50
  },
  range: [{
    component: ComponentTypes.TEXT,
    property: 'fontSize',
    min: 12,
    max: 24
  }],
  text: [{
    component: ComponentTypes.TEXT,
    property: 'content',
    text: 'important',
    mode: 'contains'
  }],
  orderBy: [{
    component: ComponentTypes.TEXT,
    property: 'content',
    direction: 'asc'
  }],
  limit: 20
});
```

### QueryBuilderを使用したクエリ

```typescript
const result = querySystem.createBuilder()
  .withComponents(ComponentTypes.POSITION, ComponentTypes.TEXT)
  .withoutComponents(ComponentTypes.ANIMATION)
  .withinCircle({ x: 100, y: 100 }, 50)
  .withRange(ComponentTypes.TEXT, 'fontSize', 12, 24)
  .withText(ComponentTypes.TEXT, 'content', 'important', 'contains')
  .where((entityId, components) => {
    const text = components.get(ComponentTypes.TEXT) as ITextComponent;
    return text && text.content.length > 5;
  })
  .orderBy(ComponentTypes.TEXT, 'content', 'asc')
  .limit(20)
  .offset(10)
  .execute(querySystem);

console.log(`Query executed in ${result.executionTime}ms`);
console.log(`Found ${result.entities.length} entities`);
console.log(`From cache: ${result.fromCache}`);
```

### パフォーマンス監視

```typescript
// 統計情報の取得
const stats = querySystem.getStats();
console.log(`Total queries: ${stats.totalQueries}`);
console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
console.log(`Average execution time: ${stats.averageExecutionTime}ms`);

// インデックス統計
console.log(`Index version: ${stats.indexStats.version}`);
console.log(`Indexed entities: ${stats.indexStats.totalIndexedEntities}`);

// キャッシュ統計
console.log(`Cache entries: ${stats.cacheStats.totalEntries}`);
console.log(`Cache hit rate: ${stats.cacheStats.hitRate}%`);
```

### 設定の更新

```typescript
// 実行時設定変更
querySystem.updateSettings({
  cacheOptions: {
    maxSize: 200,
    ttl: 10000
  },
  optimizationOptions: {
    enableOptimization: true,
    collectStats: true
  },
  debugOptions: {
    enableLogging: true,
    logSlowQueries: true,
    slowQueryThreshold: 10
  }
});
```

## エラーハンドリング

```typescript
try {
  const result = querySystem.query({
    all: [ComponentTypes.POSITION],
    where: (entityId, components) => {
      // 複雑な条件処理
      return true;
    }
  });
  
  if (result.entities.length === 0) {
    console.log('No entities found matching the criteria');
  }
} catch (error) {
  console.error('Query execution failed:', error);
  
  // キャッシュをクリアして再試行
  querySystem.invalidateCache();
}
```

## 関連文書

> [!info] 設計文書
> - [[../architecture/ecs/query-system|QuerySystem設計]]
> - [[../architecture/ecs/world|World設計]]

> [!note] 関連API
> - [[ecs-performance-monitor|PerformanceMonitor API]]
> - [[world-integration|World統合 API]]
> - [[react-integration|React統合 API]]