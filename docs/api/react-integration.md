---
title: "React統合 API仕様"
type: api
category: react
tags: [api, react, hooks, integration, typescript]
related:
  - "[[../architecture/ecs/react-integration]]"
  - "[[ecs-query-system]]"
  - "[[world-integration]]"
created: 2025-02-08
---

# React統合 API仕様

> [!info] 概要
> ECSアーキテクチャとReactの統合に関する完全なAPI仕様書です。

## 📋 目次

- [ECSProvider コンポーネント](#ecsprovider-コンポーネント)
- [useWorld フック](#useworld-フック)
- [useEntity フック](#useentity-フック)
- [useComponent フック](#usecomponent-フック)
- [useQuery フック](#usequery-フック)
- [高レベルコンポーネント](#高レベルコンポーネント)
- [型定義](#型定義)
- [使用例](#使用例)

## ECSProvider コンポーネント

ECSコンテキストを提供するプロバイダーコンポーネントです。

### Props

```typescript
interface ECSProviderProps {
  children: React.ReactNode;
  world?: World;
  eventBus?: EventBus;
}
```

### 使用例

```typescript
import { ECSProvider } from '@/hooks/ecs';

function App() {
  return (
    <ECSProvider>
      <MyComponent />
    </ECSProvider>
  );
}
```

## useWorld フック

Worldインスタンスと基本的なECS操作を提供するフックです。

### シグネチャ

```typescript
function useWorld(options?: UseWorldOptions): UseWorldResult
```

### パラメータ

#### UseWorldOptions

```typescript
interface UseWorldOptions {
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
```

### 戻り値

#### UseWorldResult

```typescript
interface UseWorldResult {
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
  addComponent: <T extends IComponent>(entityId: EntityId, component: T) => void;
  removeComponent: (entityId: EntityId, componentType: ComponentType) => boolean;
  getComponent: <T extends IComponent>(entityId: EntityId, componentType: ComponentType) => T | undefined;
  
  // クエリ操作
  query: (filter: QueryFilter) => EntityId[];
  queryBuilder: () => QueryBuilder;
  
  // バッチ操作
  batchUpdate: (operations: () => void) => void;
  
  // 状態管理
  isLoading: boolean;
  error: Error | null;
  
  // パフォーマンス
  performanceStats: PerformanceStats;
}
```

### 使用例

```typescript
function MyComponent() {
  const {
    world,
    entities,
    createEntity,
    destroyEntity,
    addComponent,
    batchUpdate,
    isLoading,
    error
  } = useWorld({
    autoSync: true,
    syncInterval: 100,
    enableBatching: true
  });

  const handleCreateIdea = useCallback(() => {
    batchUpdate(() => {
      const entityId = createEntity();
      addComponent(entityId, createTextComponent('New Idea'));
      addComponent(entityId, createPositionComponent(100, 100));
    });
  }, [createEntity, addComponent, batchUpdate]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Entities: {entities.length}</p>
      <button onClick={handleCreateIdea}>Create Idea</button>
    </div>
  );
}
```##
 useEntity フック

個別のエンティティを管理するフックです。

### シグネチャ

```typescript
function useEntity(entityId: EntityId, options?: UseEntityOptions): UseEntityResult
```

### パラメータ

#### UseEntityOptions

```typescript
interface UseEntityOptions {
  // 自動同期
  autoSync?: boolean;
  
  // コンポーネントフィルター
  watchComponents?: ComponentType[];
  
  // パフォーマンス
  enableMemoization?: boolean;
}
```

### 戻り値

#### UseEntityResult

```typescript
interface UseEntityResult {
  // エンティティ情報
  entityId: EntityId;
  exists: boolean;
  
  // コンポーネント管理
  components: Map<ComponentType, IComponent>;
  hasComponent: (componentType: ComponentType) => boolean;
  getComponent: <T extends IComponent>(componentType: ComponentType) => T | undefined;
  addComponent: <T extends IComponent>(component: T) => void;
  removeComponent: (componentType: ComponentType) => boolean;
  
  // 状態
  isLoading: boolean;
  error: Error | null;
}
```

### 使用例

```typescript
function EntityDisplay({ entityId }: { entityId: EntityId }) {
  const {
    exists,
    components,
    hasComponent,
    getComponent,
    addComponent,
    removeComponent,
    isLoading
  } = useEntity(entityId, {
    autoSync: true,
    watchComponents: [ComponentTypes.TEXT, ComponentTypes.POSITION]
  });

  const textComponent = getComponent<ITextComponent>(ComponentTypes.TEXT);
  const positionComponent = getComponent<IPositionComponent>(ComponentTypes.POSITION);

  const handleAddAnimation = useCallback(() => {
    addComponent(createAnimationComponent('fadeIn', 500));
  }, [addComponent]);

  if (isLoading) return <div>Loading entity...</div>;
  if (!exists) return <div>Entity not found</div>;

  return (
    <div>
      <h3>Entity {entityId}</h3>
      {textComponent && <p>Text: {textComponent.content}</p>}
      {positionComponent && <p>Position: ({positionComponent.x}, {positionComponent.y})</p>}
      <p>Components: {components.size}</p>
      
      {!hasComponent(ComponentTypes.ANIMATION) && (
        <button onClick={handleAddAnimation}>Add Animation</button>
      )}
    </div>
  );
}
```

## useComponent フック

特定のコンポーネントを管理するフックです。

### シグネチャ

```typescript
function useComponent<T extends IComponent>(
  entityId: EntityId,
  componentType: ComponentType,
  options?: UseComponentOptions<T>
): UseComponentResult<T>
```

### パラメータ

#### UseComponentOptions

```typescript
interface UseComponentOptions<T extends IComponent> {
  // デフォルト値
  defaultValue?: Partial<T>;
  
  // 自動作成
  autoCreate?: boolean;
  
  // 変更検知
  deepWatch?: boolean;
  
  // バリデーション
  validator?: (component: T) => boolean;
}
```

### 戻り値

#### UseComponentResult

```typescript
interface UseComponentResult<T extends IComponent> {
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
```

### 使用例

```typescript
function TextEditor({ entityId }: { entityId: EntityId }) {
  const {
    component: textComponent,
    exists,
    update,
    replace,
    remove,
    isLoading
  } = useComponent<ITextComponent>(entityId, ComponentTypes.TEXT, {
    autoCreate: true,
    defaultValue: { content: '', fontSize: 16, color: '#000000' },
    validator: (component) => component.content.length <= 100
  });

  const [inputValue, setInputValue] = useState(textComponent?.content || '');

  useEffect(() => {
    if (textComponent) {
      setInputValue(textComponent.content);
    }
  }, [textComponent]);

  const handleSave = useCallback(() => {
    if (textComponent) {
      update({ content: inputValue });
    }
  }, [textComponent, inputValue, update]);

  const handleDelete = useCallback(() => {
    remove();
  }, [remove]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter text..."
      />
      <button onClick={handleSave} disabled={!exists}>
        Save
      </button>
      <button onClick={handleDelete} disabled={!exists}>
        Delete
      </button>
      {textComponent && (
        <div>
          <p>Font Size: {textComponent.fontSize}px</p>
          <p>Color: {textComponent.color}</p>
        </div>
      )}
    </div>
  );
}
```

## useQuery フック

リアクティブなエンティティクエリを提供するフックです。

### シグネチャ

```typescript
function useQuery(filter: QueryFilter, options?: UseQueryOptions): UseQueryResult
```

### パラメータ

#### UseQueryOptions

```typescript
interface UseQueryOptions {
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
```

### 戻り値

#### UseQueryResult

```typescript
interface UseQueryResult {
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
```

### 使用例

```typescript
function EntityList() {
  const [searchText, setSearchText] = useState('');
  
  const {
    entities,
    totalCount,
    isLoading,
    error,
    refetch,
    executionTime
  } = useQuery(
    {
      all: [ComponentTypes.TEXT, ComponentTypes.POSITION],
      where: searchText ? (entityId, components) => {
        const text = components.get(ComponentTypes.TEXT) as ITextComponent;
        return text && text.content.toLowerCase().includes(searchText.toLowerCase());
      } : undefined,
      limit: 20
    },
    {
      autoUpdate: true,
      updateInterval: 1000,
      debounceMs: 300,
      enableCache: true
    }
  );

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input
        type="text"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search entities..."
      />
      
      <div>
        <p>Found {totalCount} entities (Query time: {executionTime}ms)</p>
        <button onClick={refetch}>Refresh</button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {entities.map(entityId => (
            <li key={entityId}>
              <EntityDisplay entityId={entityId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 高レベルコンポーネント

### EntityRenderer

エンティティの存在チェックとエラーハンドリングを提供するコンポーネントです。

#### Props

```typescript
interface EntityRendererProps {
  entityId: EntityId;
  children: (entity: UseEntityResult) => React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: React.ComponentType<{ error: Error; entityId: EntityId }>;
}
```

#### 使用例

```typescript
function App() {
  return (
    <EntityRenderer
      entityId="entity-123"
      fallback={<div>Entity not found</div>}
      errorBoundary={({ error, entityId }) => (
        <div>Error loading entity {entityId}: {error.message}</div>
      )}
    >
      {(entity) => (
        <div>
          <h2>Entity {entity.entityId}</h2>
          <p>Components: {entity.components.size}</p>
        </div>
      )}
    </EntityRenderer>
  );
}
```

### QueryRenderer

クエリ結果の表示とエラーハンドリングを提供するコンポーネントです。

#### Props

```typescript
interface QueryRendererProps {
  filter: QueryFilter;
  children: (result: UseQueryResult) => React.ReactNode;
  fallback?: React.ReactNode;
  emptyState?: React.ReactNode;
  errorBoundary?: React.ComponentType<{ error: Error; filter: QueryFilter }>;
  options?: UseQueryOptions;
}
```

#### 使用例

```typescript
function EntityGrid() {
  return (
    <QueryRenderer
      filter={{
        all: [ComponentTypes.POSITION, ComponentTypes.VISUAL],
        limit: 50
      }}
      fallback={<div>Loading entities...</div>}
      emptyState={<div>No entities found</div>}
      errorBoundary={({ error }) => <div>Query failed: {error.message}</div>}
      options={{ autoUpdate: true, enableCache: true }}
    >
      {({ entities, totalCount, executionTime }) => (
        <div>
          <h2>Entity Grid ({totalCount} entities)</h2>
          <p>Query time: {executionTime}ms</p>
          <div className="grid">
            {entities.map(entityId => (
              <EntityCard key={entityId} entityId={entityId} />
            ))}
          </div>
        </div>
      )}
    </QueryRenderer>
  );
}
```

### VirtualizedEntityList

大量のエンティティを効率的に表示する仮想化リストコンポーネントです。

#### Props

```typescript
interface VirtualizedEntityListProps {
  entities: EntityId[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (entityId: EntityId, index: number) => React.ReactNode;
}
```

#### 使用例

```typescript
function LargeEntityList() {
  const { entities } = useQuery({
    all: [ComponentTypes.TEXT],
    limit: 1000
  });

  return (
    <VirtualizedEntityList
      entities={entities}
      itemHeight={60}
      containerHeight={400}
      renderItem={(entityId, index) => (
        <div className="entity-item">
          <span>#{index + 1}</span>
          <EntityDisplay entityId={entityId} />
        </div>
      )}
    />
  );
}
```## 型定義


### WorldStats

```typescript
interface WorldStats {
  entityCount: number;
  componentCount: number;
  systemCount: number;
  version: number;
  memoryUsage: number;
}
```

### ECSContext

```typescript
interface ECSContext {
  world: World;
  eventBus: EventBus;
  stateSynchronizer: StateSynchronizer;
  batchUpdater: BatchUpdater;
}
```

### SyncSubscriber

```typescript
interface SyncSubscriber {
  eventTypes: string[];
  callback: (eventType: string, data: any) => void;
}
```

### BatchUpdaterOptions

```typescript
interface BatchUpdaterOptions {
  batchDelay?: number;
  maxBatchSize?: number;
}
```

## パフォーマンス最適化

### メモ化の使用

```typescript
// コンポーネントのメモ化
const MemoizedEntityDisplay = React.memo(EntityDisplay, (prevProps, nextProps) => {
  return prevProps.entityId === nextProps.entityId;
});

// フック結果のメモ化
function useMemoizedQuery(filter: QueryFilter, options: UseQueryOptions = {}) {
  const queryResult = useQuery(filter, options);
  
  return useMemo(() => queryResult, [
    queryResult.entities.length,
    queryResult.totalCount,
    queryResult.isLoading,
    queryResult.error
  ]);
}
```

### バッチ更新の活用

```typescript
function BulkEntityCreator() {
  const { batchUpdate, createEntity, addComponent } = useWorld();

  const createMultipleEntities = useCallback((count: number) => {
    batchUpdate(() => {
      for (let i = 0; i < count; i++) {
        const entityId = createEntity();
        addComponent(entityId, createTextComponent(`Entity ${i}`));
        addComponent(entityId, createPositionComponent(i * 50, i * 50));
      }
    });
  }, [batchUpdate, createEntity, addComponent]);

  return (
    <button onClick={() => createMultipleEntities(10)}>
      Create 10 Entities
    </button>
  );
}
```

### 条件付きレンダリング

```typescript
function ConditionalEntityRenderer({ entityId }: { entityId: EntityId }) {
  const { exists, hasComponent, getComponent } = useEntity(entityId);
  
  // エンティティが存在しない場合は早期リターン
  if (!exists) {
    return <div>Entity not found</div>;
  }

  // 必要なコンポーネントがない場合は早期リターン
  if (!hasComponent(ComponentTypes.TEXT)) {
    return <div>Entity has no text component</div>;
  }

  const textComponent = getComponent<ITextComponent>(ComponentTypes.TEXT);
  
  return (
    <div>
      <p>{textComponent?.content}</p>
    </div>
  );
}
```

## エラーハンドリング

### エラーバウンダリの実装

```typescript
class ECSErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ECS Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with ECS</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用例
function App() {
  return (
    <ECSErrorBoundary>
      <ECSProvider>
        <MyComponent />
      </ECSProvider>
    </ECSErrorBoundary>
  );
}
```

### フックレベルのエラーハンドリング

```typescript
function SafeEntityDisplay({ entityId }: { entityId: EntityId }) {
  const { exists, error, isLoading } = useEntity(entityId);

  if (error) {
    return (
      <div className="error">
        <p>Failed to load entity: {error.message}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="loading">Loading entity...</div>;
  }

  if (!exists) {
    return <div className="not-found">Entity not found</div>;
  }

  return <EntityDisplay entityId={entityId} />;
}
```

## テスト

### フックのテスト

```typescript
import { renderHook, act } from '@testing-library/react';
import { ECSProvider, useWorld } from '@/hooks/ecs';

describe('useWorld', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ECSProvider>{children}</ECSProvider>
  );

  it('should create and destroy entities', () => {
    const { result } = renderHook(() => useWorld(), { wrapper });

    const initialEntityCount = result.current.entities.length;

    act(() => {
      const entityId = result.current.createEntity();
      expect(result.current.entities.length).toBe(initialEntityCount + 1);
      
      result.current.destroyEntity(entityId);
      expect(result.current.entities.length).toBe(initialEntityCount);
    });
  });

  it('should handle batch updates', () => {
    const { result } = renderHook(() => useWorld(), { wrapper });

    act(() => {
      result.current.batchUpdate(() => {
        const entity1 = result.current.createEntity();
        const entity2 = result.current.createEntity();
        
        result.current.addComponent(entity1, createTextComponent('Test 1'));
        result.current.addComponent(entity2, createTextComponent('Test 2'));
      });
    });

    expect(result.current.entities.length).toBe(2);
  });
});
```

### コンポーネントのテスト

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ECSProvider } from '@/hooks/ecs';
import EntityDisplay from './EntityDisplay';

describe('EntityDisplay', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ECSProvider>{children}</ECSProvider>
  );

  it('should display entity information', () => {
    render(<EntityDisplay entityId="test-entity" />, { wrapper });
    
    expect(screen.getByText(/Entity test-entity/)).toBeInTheDocument();
  });

  it('should handle entity not found', () => {
    render(<EntityDisplay entityId="non-existent" />, { wrapper });
    
    expect(screen.getByText(/Entity not found/)).toBeInTheDocument();
  });
});
```

## 使用例

### 完全なアプリケーション例

```typescript
import React from 'react';
import { ECSProvider, useWorld, useQuery } from '@/hooks/ecs';

function PhyllotaxisApp() {
  return (
    <ECSProvider>
      <div className="app">
        <Header />
        <MainContent />
        <Sidebar />
      </div>
    </ECSProvider>
  );
}

function Header() {
  const { stats, performanceStats } = useWorld();
  
  return (
    <header>
      <h1>Phyllotaxis Planner</h1>
      <div className="stats">
        <span>Entities: {stats.entityCount}</span>
        <span>Memory: {(performanceStats.memoryUsage / 1024 / 1024).toFixed(2)}MB</span>
      </div>
    </header>
  );
}

function MainContent() {
  const { entities } = useQuery({
    all: [ComponentTypes.POSITION, ComponentTypes.VISUAL],
    orderBy: [{ component: ComponentTypes.POSITION, property: 'index', direction: 'asc' }]
  });

  return (
    <main>
      <svg width="800" height="600">
        {entities.map(entityId => (
          <EntityNode key={entityId} entityId={entityId} />
        ))}
      </svg>
    </main>
  );
}

function EntityNode({ entityId }: { entityId: EntityId }) {
  const { getComponent } = useEntity(entityId);
  
  const position = getComponent<IPositionComponent>(ComponentTypes.POSITION);
  const text = getComponent<ITextComponent>(ComponentTypes.TEXT);
  const visual = getComponent<IVisualComponent>(ComponentTypes.VISUAL);

  if (!position || !visual) return null;

  return (
    <g transform={`translate(${position.x}, ${position.y})`}>
      <circle
        r={visual.width / 2}
        fill={visual.fillColor}
        stroke={visual.strokeColor}
        strokeWidth={visual.strokeWidth}
      />
      {text && (
        <text
          textAnchor="middle"
          dy="0.3em"
          fontSize={text.fontSize}
          fill={text.color}
        >
          {text.content}
        </text>
      )}
    </g>
  );
}

function Sidebar() {
  const { createEntity, addComponent, batchUpdate } = useWorld();
  const [newIdeaText, setNewIdeaText] = useState('');

  const handleAddIdea = useCallback(() => {
    if (!newIdeaText.trim()) return;

    batchUpdate(() => {
      const entityId = createEntity();
      addComponent(entityId, createIdeaTextComponent(newIdeaText));
      addComponent(entityId, createPhyllotaxisPositionComponent(0, 0, 0, 400, 300));
      addComponent(entityId, createIdeaVisualComponent());
      addComponent(entityId, createAnimationComponent('fadeIn', 500, { isAnimating: true }));
    });

    setNewIdeaText('');
  }, [newIdeaText, createEntity, addComponent, batchUpdate]);

  return (
    <aside>
      <h2>Add New Idea</h2>
      <div>
        <input
          type="text"
          value={newIdeaText}
          onChange={(e) => setNewIdeaText(e.target.value)}
          placeholder="Enter your idea..."
          onKeyPress={(e) => e.key === 'Enter' && handleAddIdea()}
        />
        <button onClick={handleAddIdea} disabled={!newIdeaText.trim()}>
          Add Idea
        </button>
      </div>
    </aside>
  );
}

export default PhyllotaxisApp;
```

## 関連文書

> [!info] 設計文書
> - [[../architecture/ecs/react-integration|React統合設計]]
> - [[../architecture/ecs/world|World設計]]

> [!note] 関連API
> - [[ecs-query-system|QuerySystem API]]
> - [[ecs-performance-monitor|PerformanceMonitor API]]
> - [[world-integration|World統合 API]]