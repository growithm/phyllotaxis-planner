---
title: "World統合 API仕様"
type: api
category: ecs
tags: [api, ecs, world, integration, typescript]
related:
  - "[[../architecture/ecs/world]]"
  - "[[ecs-query-system]]"
  - "[[ecs-performance-monitor]]"
  - "[[react-integration]]"
created: 2025-02-08
---

# World統合 API仕様

> [!info] 概要
> ECSアーキテクチャにおけるWorld統合機能の完全なAPI仕様書です。

## 📋 目次

- [World クラス](#world-クラス)
- [BlueprintRegistry クラス](#blueprintregistry-クラス)
- [EntityBlueprint 基底クラス](#entityblueprint-基底クラス)
- [StateSynchronizer クラス](#statesynchronizer-クラス)
- [BatchUpdater クラス](#batchupdater-クラス)
- [型定義](#型定義)
- [使用例](#使用例)

## World クラス

### 統合機能メソッド

#### registerBlueprint

```typescript
registerBlueprint(blueprint: EntityBlueprint): void
```

エンティティブループリントを登録します。

**パラメータ:**
- `blueprint: EntityBlueprint` - 登録するブループリント

**例:**
```typescript
world.registerBlueprint(new IdeaBlueprint());
world.registerBlueprint(new ThemeBlueprint());
```

#### createEntityFromBlueprint

```typescript
createEntityFromBlueprint(blueprintName: string, ...args: any[]): EntityId
```

ブループリントからエンティティを作成します。

**パラメータ:**
- `blueprintName: string` - ブループリント名
- `...args: any[]` - ブループリント固有の引数

**戻り値:**
- `EntityId` - 作成されたエンティティID

**例:**
```typescript
const ideaEntity = world.createEntityFromBlueprint('idea', 'My new idea', {
  x: 100,
  y: 200,
  withAnimation: true
});

const themeEntity = world.createEntityFromBlueprint('theme', 'Central Theme', {
  x: 400,
  y: 300
});
```

#### getAvailableBlueprints

```typescript
getAvailableBlueprints(): string[]
```

利用可能なブループリント名の一覧を取得します。

**戻り値:**
- `string[]` - ブループリント名の配列

**例:**
```typescript
const blueprints = world.getAvailableBlueprints();
console.log('Available blueprints:', blueprints); // ['idea', 'theme']
```

#### unregisterBlueprint

```typescript
unregisterBlueprint(blueprintName: string): boolean
```

ブループリントの登録を解除します。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `boolean` - 解除に成功したかどうか

#### hasBlueprint

```typescript
hasBlueprint(blueprintName: string): boolean
```

指定されたブループリントが登録されているかチェックします。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `boolean` - 登録されているかどうか

#### getBlueprintInfo

```typescript
getBlueprintInfo(blueprintName: string): BlueprintInfo | undefined
```

ブループリントの詳細情報を取得します。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `BlueprintInfo | undefined` - ブループリント情報

### クエリ統合メソッド

#### query

```typescript
query(filter: QueryFilter): EntityId[]
```

基本的なエンティティクエリを実行します。

**パラメータ:**
- `filter: QueryFilter` - クエリフィルター

**戻り値:**
- `EntityId[]` - 該当するエンティティIDの配列

#### queryWithCallback

```typescript
queryWithCallback(
  filter: QueryFilter,
  callback: (entityId: EntityId, components: Map<ComponentType, IComponent>) => void
): void
```

クエリ結果に対してコールバック関数を実行します。

**パラメータ:**
- `filter: QueryFilter` - クエリフィルター
- `callback` - 各エンティティに対して実行する関数

#### invalidateQueryCache

```typescript
invalidateQueryCache(): void
```

クエリキャッシュを無効化します。

### バッチ操作メソッド

#### batchUpdate

```typescript
batchUpdate(operations: () => void): void
```

複数の操作をバッチで実行します。

**パラメータ:**
- `operations: () => void` - 実行する操作群

**例:**
```typescript
world.batchUpdate(() => {
  const entity1 = world.createEntity();
  const entity2 = world.createEntity();
  
  world.addComponent(entity1, createTextComponent('Entity 1'));
  world.addComponent(entity2, createTextComponent('Entity 2'));
});
```

### パフォーマンス監視メソッド

#### getPerformanceStats

```typescript
getPerformanceStats(): PerformanceStats
```

パフォーマンス統計を取得します。

**戻り値:**
- `PerformanceStats` - パフォーマンス統計情報

#### cleanup

```typescript
cleanup(): void
```

メモリ最適化のためのクリーンアップを実行します。

#### clear

```typescript
clear(): void
```

Worldの全データをクリアします（主にテスト用）。

## BlueprintRegistry クラス

### メソッド

#### register

```typescript
register(blueprint: EntityBlueprint): void
```

ブループリントを登録します。

**パラメータ:**
- `blueprint: EntityBlueprint` - 登録するブループリント

#### unregister

```typescript
unregister(blueprintName: string): boolean
```

ブループリントの登録を解除します。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `boolean` - 解除に成功したかどうか

#### get

```typescript
get(blueprintName: string): EntityBlueprint | undefined
```

ブループリントを取得します。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `EntityBlueprint | undefined` - ブループリントインスタンス

#### has

```typescript
has(blueprintName: string): boolean
```

ブループリントが登録されているかチェックします。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `boolean` - 登録されているかどうか

#### listBlueprints

```typescript
listBlueprints(): string[]
```

登録されているブループリント名の一覧を取得します。

**戻り値:**
- `string[]` - ブループリント名の配列

#### getInfo

```typescript
getInfo(blueprintName: string): BlueprintInfo | undefined
```

ブループリントの詳細情報を取得します。

**パラメータ:**
- `blueprintName: string` - ブループリント名

**戻り値:**
- `BlueprintInfo | undefined` - ブループリント情報

#### getAllInfo

```typescript
getAllInfo(): BlueprintInfo[]
```

全ブループリントの詳細情報を取得します。

**戻り値:**
- `BlueprintInfo[]` - 全ブループリント情報の配列#
# EntityBlueprint 基底クラス

### 抽象プロパティ

#### name

```typescript
abstract readonly name: string
```

ブループリントの一意な名前です。

#### description

```typescript
abstract readonly description: string
```

ブループリントの説明です。

#### requiredComponents

```typescript
abstract readonly requiredComponents: ComponentType[]
```

このブループリントで作成されるエンティティが必ず持つコンポーネントタイプの配列です。

#### optionalComponents

```typescript
abstract readonly optionalComponents: ComponentType[]
```

このブループリントで作成されるエンティティが持つ可能性があるコンポーネントタイプの配列です。

### 抽象メソッド

#### create

```typescript
abstract create(world: IWorld, ...args: any[]): EntityId
```

エンティティを作成します。

**パラメータ:**
- `world: IWorld` - Worldインスタンス
- `...args: any[]` - ブループリント固有の引数

**戻り値:**
- `EntityId` - 作成されたエンティティID

### 仮想メソッド

#### validate

```typescript
validate(world: IWorld, ...args: any[]): boolean
```

作成前のバリデーションを行います。

**パラメータ:**
- `world: IWorld` - Worldインスタンス
- `...args: any[]` - ブループリント固有の引数

**戻り値:**
- `boolean` - バリデーション結果

**デフォルト実装:**
```typescript
validate(world: IWorld, ...args: any[]): boolean {
  return true;
}
```

#### beforeCreate

```typescript
beforeCreate(world: IWorld, ...args: any[]): void
```

エンティティ作成前の処理を行います。

**パラメータ:**
- `world: IWorld` - Worldインスタンス
- `...args: any[]` - ブループリント固有の引数

#### afterCreate

```typescript
afterCreate(world: IWorld, entityId: EntityId, ...args: any[]): void
```

エンティティ作成後の処理を行います。

**パラメータ:**
- `world: IWorld` - Worldインスタンス
- `entityId: EntityId` - 作成されたエンティティID
- `...args: any[]` - ブループリント固有の引数

### カスタムブループリントの実装例

```typescript
export class CustomBlueprint extends EntityBlueprint {
  readonly name = 'custom';
  readonly description = 'Custom entity with specific components';
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];
  readonly optionalComponents = [ComponentTypes.VISUAL, ComponentTypes.ANIMATION];

  create(world: IWorld, text: string, options: CustomOptions = {}): EntityId {
    this.beforeCreate(world, text, options);

    if (!this.validate(world, text, options)) {
      throw new Error('Custom blueprint validation failed');
    }

    const entityId = world.createEntity();

    try {
      // 必須コンポーネントの追加
      world.addComponent(entityId, createTextComponent(text));
      world.addComponent(entityId, createPositionComponent(
        options.x ?? 0,
        options.y ?? 0
      ));

      // オプショナルコンポーネントの追加
      if (options.withVisual) {
        world.addComponent(entityId, createVisualComponent());
      }

      if (options.withAnimation) {
        world.addComponent(entityId, createAnimationComponent());
      }

      this.afterCreate(world, entityId, text, options);
      return entityId;

    } catch (error) {
      world.destroyEntity(entityId);
      throw error;
    }
  }

  validate(world: IWorld, text: string, options: CustomOptions = {}): boolean {
    if (!text || text.trim().length === 0) {
      return false;
    }
    if (text.length > 200) {
      return false;
    }
    return true;
  }

  beforeCreate(world: IWorld, text: string, options: CustomOptions = {}): void {
    console.log(`Creating custom entity with text: "${text}"`);
  }

  afterCreate(world: IWorld, entityId: EntityId, text: string, options: CustomOptions = {}): void {
    console.log(`Custom entity created with ID: ${entityId}`);
  }
}

interface CustomOptions {
  x?: number;
  y?: number;
  withVisual?: boolean;
  withAnimation?: boolean;
}
```

## StateSynchronizer クラス

### メソッド

#### subscribe

```typescript
subscribe(key: string, subscriber: SyncSubscriber): () => void
```

同期イベントを購読します。

**パラメータ:**
- `key: string` - 購読者の識別キー
- `subscriber: SyncSubscriber` - 購読者情報

**戻り値:**
- `() => void` - 購読解除関数

**例:**
```typescript
const unsubscribe = stateSynchronizer.subscribe('my-component', {
  eventTypes: ['entity-created', 'component-added'],
  callback: (eventType, data) => {
    console.log(`Event: ${eventType}`, data);
  }
});

// 購読解除
unsubscribe();
```

#### enqueueSyncOperation

```typescript
enqueueSyncOperation(operation: SyncOperation): void
```

同期操作をキューに追加します。

**パラメータ:**
- `operation: SyncOperation` - 同期操作

#### getStats

```typescript
getStats(): SyncStats
```

同期システムの統計情報を取得します。

**戻り値:**
- `SyncStats` - 統計情報

## BatchUpdater クラス

### メソッド

#### batch

```typescript
batch(operation: () => void): void
```

操作をバッチキューに追加します。

**パラメータ:**
- `operation: () => void` - 実行する操作

**例:**
```typescript
batchUpdater.batch(() => {
  const entity = world.createEntity();
  world.addComponent(entity, createTextComponent('Batched'));
});
```

#### flush

```typescript
flush(): void
```

バッチキューを強制的に実行します。

#### getStats

```typescript
getStats(): BatchStats
```

バッチシステムの統計情報を取得します。

**戻り値:**
- `BatchStats` - 統計情報

## 型定義

### BlueprintInfo

```typescript
interface BlueprintInfo {
  name: string;
  description: string;
  requiredComponents: ComponentType[];
  optionalComponents: ComponentType[];
  registeredAt: Date;
}
```

### CreateEntityOptions

```typescript
interface CreateEntityOptions {
  x?: number;
  y?: number;
  withAnimation?: boolean;
  animationDuration?: number;
  customTextOptions?: Partial<ITextComponent>;
  customVisualOptions?: Partial<IVisualComponent>;
  customPositionOptions?: Partial<IPositionComponent>;
}
```

### SyncSubscriber

```typescript
interface SyncSubscriber {
  eventTypes: string[];
  callback: (eventType: string, data: any) => void;
}
```

### SyncOperation

```typescript
interface SyncOperation {
  type: 'entity-created' | 'entity-destroyed' | 'component-added' | 'component-removed' | 'component-updated';
  data: any;
  timestamp: number;
}
```

### SyncStats

```typescript
interface SyncStats {
  subscriberCount: number;
  queueLength: number;
  isProcessing: boolean;
}
```

### BatchStats

```typescript
interface BatchStats {
  queueLength: number;
  batchDelay: number;
  maxBatchSize: number;
  hasPendingBatch: boolean;
}
```

### PerformanceStats

```typescript
interface PerformanceStats {
  entityCount: number;
  componentCount: number;
  systemCount: number;
  version: number;
  memoryUsage: number;
}
```

## 使用例

### ブループリントの登録と使用

```typescript
// カスタムブループリントの作成
class ProjectBlueprint extends EntityBlueprint {
  readonly name = 'project';
  readonly description = 'Project entity with title and description';
  readonly requiredComponents = [ComponentTypes.TEXT, ComponentTypes.POSITION];
  readonly optionalComponents = [ComponentTypes.VISUAL];

  create(world: IWorld, title: string, description: string): EntityId {
    const entityId = world.createEntity();
    
    world.addComponent(entityId, createTextComponent(title));
    world.addComponent(entityId, createPositionComponent(0, 0));
    
    // 説明を別のテキストコンポーネントとして追加する場合の例
    // （実際の実装では適切なコンポーネント設計が必要）
    
    return entityId;
  }
}

// ブループリントの登録
world.registerBlueprint(new ProjectBlueprint());

// ブループリントからエンティティ作成
const projectEntity = world.createEntityFromBlueprint(
  'project',
  'My Project',
  'This is a sample project'
);
```

### バッチ操作の活用

```typescript
// 大量のエンティティを効率的に作成
world.batchUpdate(() => {
  for (let i = 0; i < 100; i++) {
    const entity = world.createEntityFromBlueprint('idea', `Idea ${i}`, {
      x: Math.random() * 800,
      y: Math.random() * 600,
      withAnimation: true
    });
  }
});

// 複数のエンティティを一括更新
const entities = world.getEntitiesWithComponents(ComponentTypes.TEXT);
world.batchUpdate(() => {
  entities.forEach(entityId => {
    const textComponent = world.getComponent<ITextComponent>(entityId, ComponentTypes.TEXT);
    if (textComponent && textComponent.content.includes('old')) {
      world.removeComponent(entityId, ComponentTypes.TEXT);
      world.addComponent(entityId, createTextComponent(
        textComponent.content.replace('old', 'new')
      ));
    }
  });
});
```

### 状態同期の設定

```typescript
// React コンポーネントでの状態同期
function useWorldSync() {
  const [entities, setEntities] = useState<EntityId[]>([]);
  const stateSynchronizer = world.getStateSynchronizer();

  useEffect(() => {
    const unsubscribe = stateSynchronizer.subscribe('react-sync', {
      eventTypes: ['entity-created', 'entity-destroyed'],
      callback: (eventType, data) => {
        if (eventType === 'entity-created') {
          setEntities(prev => [...prev, data.entityId]);
        } else if (eventType === 'entity-destroyed') {
          setEntities(prev => prev.filter(id => id !== data.entityId));
        }
      }
    });

    return unsubscribe;
  }, [stateSynchronizer]);

  return entities;
}
```

### パフォーマンス監視

```typescript
// パフォーマンス統計の定期取得
setInterval(() => {
  const stats = world.getPerformanceStats();
  
  console.log('Performance Stats:', {
    entities: stats.entityCount,
    components: stats.componentCount,
    memory: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
    version: stats.version
  });

  // メモリ使用量が閾値を超えた場合のクリーンアップ
  if (stats.memoryUsage > 50 * 1024 * 1024) { // 50MB
    console.warn('High memory usage detected, performing cleanup');
    world.cleanup();
  }
}, 5000);
```

### エラーハンドリング

```typescript
// ブループリント作成時のエラーハンドリング
function createEntitySafely(blueprintName: string, ...args: any[]): EntityId | null {
  try {
    if (!world.hasBlueprint(blueprintName)) {
      console.error(`Blueprint '${blueprintName}' not found`);
      return null;
    }

    return world.createEntityFromBlueprint(blueprintName, ...args);
  } catch (error) {
    console.error(`Failed to create entity from blueprint '${blueprintName}':`, error);
    return null;
  }
}

// バッチ操作のエラーハンドリング
function safeBatchUpdate(operations: () => void): boolean {
  try {
    world.batchUpdate(operations);
    return true;
  } catch (error) {
    console.error('Batch update failed:', error);
    return false;
  }
}
```

### デバッグとトラブルシューティング

```typescript
// ブループリント情報の確認
function debugBlueprints() {
  const blueprints = world.getAvailableBlueprints();
  
  console.log('Available Blueprints:');
  blueprints.forEach(name => {
    const info = world.getBlueprintInfo(name);
    if (info) {
      console.log(`- ${name}: ${info.description}`);
      console.log(`  Required: ${info.requiredComponents.join(', ')}`);
      console.log(`  Optional: ${info.optionalComponents.join(', ')}`);
      console.log(`  Registered: ${info.registeredAt.toISOString()}`);
    }
  });
}

// World状態の確認
function debugWorldState() {
  const stats = world.getPerformanceStats();
  const entityStats = world.getEntityStats();
  const componentStats = world.getComponentStats();

  console.log('World State:', {
    version: stats.version,
    entities: {
      total: entityStats.total,
      active: entityStats.active
    },
    components: componentStats,
    memory: `${(stats.memoryUsage / 1024 / 1024).toFixed(2)}MB`
  });
}
```

## 関連文書

> [!info] 設計文書
> - [[../architecture/ecs/world|World設計]]
> - [[../architecture/ecs/query-system|QuerySystem設計]]
> - [[../architecture/ecs/performance-monitor|PerformanceMonitor設計]]

> [!note] 関連API
> - [[ecs-query-system|QuerySystem API]]
> - [[ecs-performance-monitor|PerformanceMonitor API]]
> - [[react-integration|React統合 API]]