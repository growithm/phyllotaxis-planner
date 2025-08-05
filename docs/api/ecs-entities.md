---
title: "ECSエンティティAPI仕様"
type: api
category: ecs
tags: [api, ecs, entities, factory, types, manager]
related:
  - "[[ecs-components]]"
  - "[[ecs-systems]]"
  - "[[../architecture/ecs/entities]]"
created: 2025-02-08
updated: 2025-02-08
---

# ECSエンティティAPI仕様

> [!info] 概要
> Phyllotaxis PlannerのECSエンティティ管理システムのAPI仕様書です。EntityFactory、EntityTypeManager、EntityManagerの3つの主要クラスの詳細な仕様を定義します。

## 🏭 EntityFactory

> [!note] 責務
> エンティティタイプに応じた適切なコンポーネント構成でエンティティを作成

### インターフェース

```typescript
// src/ecs/entities/EntityFactory.ts

export interface CreateEntityOptions {
  // 位置設定
  x?: number;
  y?: number;
  
  // アニメーション設定
  withAnimation?: boolean;
  animationDuration?: number;
  
  // カスタムコンポーネント設定
  customTextOptions?: Partial<ITextComponent>;
  customVisualOptions?: Partial<IVisualComponent>;
  customPositionOptions?: Partial<IPositionComponent>;
}

export class EntityFactory {
  constructor(world: IWorld);
  
  // メソッド
  getTypeManager(): EntityTypeManager;
  createThemeEntity(content: string, options?: CreateEntityOptions): EntityId | null;
  createIdeaEntity(content: string, options?: CreateEntityOptions): EntityId | null;
  createEntity(type: EntityType, content: string, options?: CreateEntityOptions): EntityId | null;
  destroyEntity(entityId: EntityId): boolean;
  cloneEntity(sourceEntityId: EntityId, newContent?: string): EntityId | null;
  createIdeaEntitiesBatch(contents: string[]): EntityId[];
  getCreationStatistics(): EntityTypeStatistics;
}
```

### メソッド詳細

#### `createThemeEntity(content: string, options?: CreateEntityOptions): EntityId | null`

**説明**: 中心テーマエンティティを作成します。

**パラメータ**:
- `content`: テーマのテキスト内容
- `options`: 作成オプション（位置、アニメーション等）

**戻り値**: 
- 成功時: 作成されたエンティティのID
- 失敗時: `null`（制限に達している場合）

**作成されるコンポーネント**:
- `TextComponent` (entityType: 'theme')
- `VisualComponent` (テーマ用スタイル)
- `PositionComponent` (中心位置、index: -1)
- `AnimationComponent` (オプション)

**例**:
```typescript
const factory = new EntityFactory(world);
const themeId = factory.createThemeEntity('プロジェクト企画', {
  x: 400,
  y: 300,
  withAnimation: true
});
```

#### `createIdeaEntity(content: string, options?: CreateEntityOptions): EntityId | null`

**説明**: アイデアエンティティを作成します。

**パラメータ**:
- `content`: アイデアのテキスト内容
- `options`: 作成オプション

**戻り値**: 
- 成功時: 作成されたエンティティのID
- 失敗時: `null`（制限に達している場合）

**作成されるコンポーネント**:
- `TextComponent` (entityType: 'idea')
- `VisualComponent` (アイデア用スタイル)
- `PositionComponent` (フィロタキシス位置またはカスタム位置)
- `AnimationComponent` (デフォルト)

**例**:
```typescript
const ideaId = factory.createIdeaEntity('ユーザーインタビュー', {
  withAnimation: true,
  animationDuration: 800
});
```

#### `createIdeaEntitiesBatch(contents: string[]): EntityId[]`

**説明**: 複数のアイデアエンティティを一括作成します。

**パラメータ**:
- `contents`: アイデアテキストの配列

**戻り値**: 作成されたエンティティIDの配列

**例**:
```typescript
const ideas = [
  'ユーザーリサーチ',
  'プロトタイプ作成',
  'テスト実施'
];
const entityIds = factory.createIdeaEntitiesBatch(ideas);
```

---

## 🏷️ EntityTypeManager

> [!note] 責務
> エンティティタイプの識別と制限管理

### インターフェース

```typescript
// src/ecs/entities/EntityTypes.ts

export type EntityType = 'idea' | 'theme';

export interface EntityTypeInfo {
  type: EntityType;
  displayName: string;
  description: string;
  maxCount: number; // -1 = 無制限
  requiredComponents: string[];
  optionalComponents: string[];
}

export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeInfo>;

export class EntityTypeManager {
  constructor(world: IWorld);
  
  // メソッド
  getEntityType(entityId: EntityId): EntityType | undefined;
  isThemeEntity(entityId: EntityId): boolean;
  isIdeaEntity(entityId: EntityId): boolean;
  getEntitiesByType(type: EntityType): EntityId[];
  getThemeEntity(): EntityId | undefined;
  getIdeaEntities(): EntityId[];
  getEntityCount(type: EntityType): number;
  canCreateEntity(type: EntityType): boolean;
  getTypeConstraints(type: EntityType): TypeConstraints;
  validateEntityComponents(entityId: EntityId): ComponentValidation;
  getTypeStatistics(): EntityTypeStatistics;
  invalidateCache(): void;
}
```

### 型定義

```typescript
export interface TypeConstraints {
  maxCount: number;
  currentCount: number;
  canCreate: boolean;
  remaining: number;
}

export interface ComponentValidation {
  isValid: boolean;
  missingRequired: string[];
  hasOptional: string[];
}

export interface EntityTypeStatistics {
  [key: string]: {
    count: number;
    maxCount: number;
    percentage: number;
    canCreate: boolean;
  };
}
```

### エンティティタイプ設定

```typescript
export const ENTITY_TYPE_CONFIG: Record<EntityType, EntityTypeInfo> = {
  theme: {
    type: 'theme',
    displayName: '中心テーマ',
    description: 'マップの中心となる主要テーマ',
    maxCount: 1, // テーマは1つのみ
    requiredComponents: ['position', 'text', 'visual'],
    optionalComponents: ['animation'],
  },
  idea: {
    type: 'idea',
    displayName: 'アイデア',
    description: 'テーマから派生するアイデア要素',
    maxCount: 50, // MVP制限
    requiredComponents: ['position', 'text', 'visual'],
    optionalComponents: ['animation'],
  },
};
```

### メソッド詳細

#### `getEntityType(entityId: EntityId): EntityType | undefined`

**説明**: エンティティのタイプを取得します（キャッシュ付き）。

**パラメータ**:
- `entityId`: 対象エンティティのID

**戻り値**: エンティティタイプまたは`undefined`

**例**:
```typescript
const typeManager = new EntityTypeManager(world);
const entityType = typeManager.getEntityType('entity_1');
if (entityType === 'theme') {
  // テーマエンティティの処理
}
```

#### `canCreateEntity(type: EntityType): boolean`

**説明**: 指定されたタイプのエンティティを新規作成可能かチェックします。

**パラメータ**:
- `type`: エンティティタイプ

**戻り値**: 作成可能な場合`true`

**例**:
```typescript
if (typeManager.canCreateEntity('idea')) {
  // アイデアエンティティを作成
  const ideaId = factory.createIdeaEntity('新しいアイデア');
}
```

#### `getTypeConstraints(type: EntityType): TypeConstraints`

**説明**: エンティティタイプの制限情報を取得します。

**戻り値**: 制限情報オブジェクト

**例**:
```typescript
const constraints = typeManager.getTypeConstraints('idea');
console.log(`アイデア: ${constraints.currentCount}/${constraints.maxCount}`);
console.log(`残り作成可能数: ${constraints.remaining}`);
```

---

## 🔍 EntityManager

> [!note] 責務
> エンティティのライフサイクル管理とクエリ機能を提供

### インターフェース

```typescript
// src/ecs/entities/EntityManager.ts

export interface EntityQuery {
  type?: EntityType;
  hasComponents?: string[];
  textContains?: string;
  indexRange?: { min: number; max: number };
  isAnimating?: boolean;
  isVisible?: boolean;
}

export class EntityManager {
  constructor(world: IWorld);
  
  // アクセサ
  getFactory(): EntityFactory;
  getTypeManager(): EntityTypeManager;
  
  // クエリメソッド
  query(conditions: EntityQuery): EntityId[];
  getIdeaEntitiesSorted(): EntityId[];
  getThemeEntity(): EntityId | undefined;
  getIdeaByIndex(index: number): EntityId | undefined;
  searchByText(searchText: string): EntityId[];
  getAnimatingEntities(): EntityId[];
  getVisibleEntities(): EntityId[];
  
  // 管理メソッド
  reorderIdeaEntities(): void;
  moveEntityToIndex(entityId: EntityId, newIndex: number): boolean;
  removeEntityAndReorder(entityId: EntityId): boolean;
  
  // 統計・検証メソッド
  getStatistics(): EntityStatistics;
  validateAllEntities(): EntityValidation;
  repairEntities(): number;
}
```

### 型定義

```typescript
export interface EntityStatistics {
  total: number;
  byType: EntityTypeStatistics;
  animating: number;
  visible: number;
  performance: {
    memoryUsage: number;
  };
}

export interface EntityValidation {
  valid: EntityId[];
  invalid: Array<{
    entityId: EntityId;
    issues: string[];
  }>;
}
```

### メソッド詳細

#### `query(conditions: EntityQuery): EntityId[]`

**説明**: 指定された条件でエンティティを検索します。

**パラメータ**:
- `conditions`: クエリ条件

**戻り値**: 条件に一致するエンティティIDの配列

**例**:
```typescript
const manager = new EntityManager(world);

// アイデアエンティティのみ取得
const ideas = manager.query({ type: 'idea' });

// 特定のテキストを含むエンティティを検索
const searchResults = manager.query({ 
  textContains: 'ユーザー' 
});

// アニメーション中のエンティティを取得
const animating = manager.query({ 
  isAnimating: true 
});

// 複合条件
const complexQuery = manager.query({
  type: 'idea',
  hasComponents: ['position', 'visual'],
  indexRange: { min: 0, max: 10 }
});
```

#### `getIdeaEntitiesSorted(): EntityId[]`

**説明**: アイデアエンティティをインデックス順でソートして取得します。

**戻り値**: ソートされたアイデアエンティティIDの配列

**例**:
```typescript
const sortedIdeas = manager.getIdeaEntitiesSorted();
sortedIdeas.forEach((entityId, index) => {
  console.log(`Index ${index}: ${entityId}`);
});
```

#### `moveEntityToIndex(entityId: EntityId, newIndex: number): boolean`

**説明**: エンティティを指定されたインデックスに移動し、他のエンティティのインデックスを調整します。

**パラメータ**:
- `entityId`: 移動するエンティティのID
- `newIndex`: 新しいインデックス

**戻り値**: 移動が成功した場合`true`

**例**:
```typescript
// エンティティを先頭に移動
const success = manager.moveEntityToIndex('entity_5', 0);
if (success) {
  console.log('エンティティの移動が完了しました');
}
```

#### `validateAllEntities(): EntityValidation`

**説明**: 全エンティティの整合性をチェックします。

**戻り値**: 検証結果オブジェクト

**例**:
```typescript
const validation = manager.validateAllEntities();
console.log(`有効なエンティティ: ${validation.valid.length}`);
console.log(`無効なエンティティ: ${validation.invalid.length}`);

validation.invalid.forEach(({ entityId, issues }) => {
  console.log(`${entityId}: ${issues.join(', ')}`);
});
```

#### `getStatistics(): EntityStatistics`

**説明**: エンティティシステムの統計情報を取得します。

**戻り値**: 統計情報オブジェクト

**例**:
```typescript
const stats = manager.getStatistics();
console.log(`総エンティティ数: ${stats.total}`);
console.log(`テーマ: ${stats.byType.theme.count}`);
console.log(`アイデア: ${stats.byType.idea.count}`);
console.log(`メモリ使用量: ${stats.performance.memoryUsage} bytes`);
```

---

## 🔧 ヘルパー関数

> [!note] 責務
> エンティティとコンポーネントの操作を簡素化

```typescript
// src/ecs/components/helpers.ts

// エンティティタイプ判定
export const isThemeEntity = (world: IWorld, entityId: EntityId): boolean;
export const isIdeaEntity = (world: IWorld, entityId: EntityId): boolean;

// エンティティ取得
export const getThemeEntity = (world: IWorld): EntityId | undefined;
export const getIdeaEntitiesSortedByIndex = (world: IWorld): EntityId[];
export const getIdeaEntityByIndex = (world: IWorld, index: number): EntityId | undefined;

// インデックス管理
export const getNextAvailableIndex = (world: IWorld): number;

// コンポーネント取得
export const getPositionComponent = (world: IWorld, entityId: EntityId): IPositionComponent | undefined;
export const getTextComponent = (world: IWorld, entityId: EntityId): ITextComponent | undefined;
export const getVisualComponent = (world: IWorld, entityId: EntityId): IVisualComponent | undefined;
export const getAnimationComponent = (world: IWorld, entityId: EntityId): IAnimationComponent | undefined;

// 状態チェック
export const hasRequiredComponents = (world: IWorld, entityId: EntityId, requiredTypes: string[]): boolean;
export const getAnimatingEntities = (world: IWorld): EntityId[];
```

---

## 📝 使用例

### 基本的な使用パターン

```typescript
// 初期化
const world = new World();
const entityManager = new EntityManager(world);
const factory = entityManager.getFactory();
const typeManager = entityManager.getTypeManager();

// テーマエンティティ作成
const themeId = factory.createThemeEntity('プロジェクト企画', {
  x: 400,
  y: 300,
  withAnimation: true
});

// アイデアエンティティ作成
const ideaIds = factory.createIdeaEntitiesBatch([
  'ユーザーリサーチ',
  '競合分析',
  'プロトタイプ作成'
]);

// エンティティ検索
const allIdeas = entityManager.query({ type: 'idea' });
const searchResults = entityManager.searchByText('ユーザー');

// 統計情報取得
const stats = entityManager.getStatistics();
console.log(`アイデア数: ${stats.byType.idea.count}/50`);

// 整合性チェック
const validation = entityManager.validateAllEntities();
if (validation.invalid.length > 0) {
  const repaired = entityManager.repairEntities();
  console.log(`${repaired}個のエンティティを修復しました`);
}
```

### エラーハンドリング

```typescript
// 制限チェック付きエンティティ作成
function createIdeaSafely(content: string): EntityId | null {
  const typeManager = entityManager.getTypeManager();
  
  if (!typeManager.canCreateEntity('idea')) {
    const constraints = typeManager.getTypeConstraints('idea');
    console.warn(`アイデア作成制限に達しています (${constraints.currentCount}/${constraints.maxCount})`);
    return null;
  }
  
  return factory.createIdeaEntity(content);
}

// バリデーション付きエンティティ操作
function moveEntitySafely(entityId: EntityId, newIndex: number): boolean {
  const validation = entityManager.validateAllEntities();
  const entityValid = validation.valid.includes(entityId);
  
  if (!entityValid) {
    console.error(`エンティティ ${entityId} は無効です`);
    return false;
  }
  
  return entityManager.moveEntityToIndex(entityId, newIndex);
}
```

---

## 🔗 関連文書

> [!info] 設計文書
> - [[../architecture/ecs/entities|ECSエンティティ設計]]
> - [[../architecture/ecs/components|ECSコンポーネント設計]]
> - [[../architecture/ecs/systems|ECSシステム設計]]

> [!note] API文書
> - [[ecs-components|ECSコンポーネントAPI]]
> - [[ecs-systems|ECSシステムAPI]]

> [!warning] 実装ガイドライン
> - エンティティ作成前に必ず制限チェックを実行
> - 大量のエンティティ操作時はバッチ処理を使用
> - 定期的な整合性チェックを推奨
> - メモリ使用量の監視を実装