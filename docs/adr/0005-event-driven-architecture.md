# ADR-0005: イベント駆動アーキテクチャ採用の決定

## ステータス

承認済み

## コンテキスト

Phyllotaxis Plannerにおいて、異なるコンポーネントやシステム間での通信方法の選択が必要でした。以下の要件を考慮する必要がありました：

- UIコンポーネント、ECSシステム、ビジネスロジック間の疎結合
- アイデア追加、位置計算、アニメーション、描画更新の連携
- 将来的な機能拡張時の既存コードへの影響最小化
- デバッグとテストの容易さ
- パフォーマンスの最適化
- React の状態管理との統合

## 決定

イベント駆動アーキテクチャ（Event-Driven Architecture）を採用し、カスタムイベントバスを実装することを決定しました。

## 理由

### イベント駆動アーキテクチャ採用の理由

1. **疎結合**: コンポーネント間の直接的な依存関係を排除
2. **拡張性**: 新しいイベントリスナーの追加が既存コードに影響しない
3. **再利用性**: イベントベースの機能は他のコンテキストでも再利用可能
4. **テスタビリティ**: イベントの発火と処理を独立してテスト可能
5. **デバッグ性**: イベントフローの追跡によるデバッグの容易さ
6. **非同期処理**: イベントによる非同期処理の自然な実装

### イベントバス実装

```typescript
// イベントバスの基本実装
interface EventBus {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler: Function): void;
  once<T>(event: string, handler: (data: T) => void): void;
}

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<Function>>();
  
  emit<T>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
  
  on<T>(event: string, handler: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    // アンサブスクライブ関数を返す
    return () => this.off(event, handler);
  }
  
  off(event: string, handler: Function): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}
```

### イベント定義

```typescript
// アイデア関連イベント
export enum IdeaEvents {
  IDEA_ADDED = 'idea:added',
  IDEA_REMOVED = 'idea:removed',
  IDEA_UPDATED = 'idea:updated',
  POSITION_CALCULATED = 'position:calculated',
  THEME_CHANGED = 'theme:changed',
}

// システムイベント
export enum SystemEvents {
  ANIMATION_START = 'animation:start',
  ANIMATION_END = 'animation:end',
  RENDER_REQUESTED = 'render:requested',
  ERROR_OCCURRED = 'error:occurred',
}

// イベントデータの型定義
export interface IdeaAddedEvent {
  id: string;
  text: string;
  timestamp: Date;
}

export interface PositionCalculatedEvent {
  entityId: string;
  position: Position;
  angle: number;
  radius: number;
}
```

### React統合

```typescript
// カスタムフック実装
export const useEventBus = () => {
  const eventBus = useRef(new EventBusImpl()).current;
  
  const emit = useCallback(<T>(event: string, data: T) => {
    eventBus.emit(event, data);
  }, [eventBus]);
  
  const subscribe = useCallback(<T>(
    event: string,
    handler: (data: T) => void
  ) => {
    return eventBus.on(event, handler);
  }, [eventBus]);
  
  return { emit, subscribe };
};

// コンポーネントでの使用例
const AddIdeaForm: React.FC = () => {
  const { emit } = useEventBus();
  
  const handleSubmit = (text: string) => {
    emit(IdeaEvents.IDEA_ADDED, {
      id: generateId(),
      text,
      timestamp: new Date()
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* フォーム実装 */}
    </form>
  );
};
```

## 代替案

### Props Drilling
**利点:**
- Reactの標準的なアプローチ
- 明示的なデータフロー

**欠点:**
- 深いコンポーネント階層での複雑性
- 中間コンポーネントの不要なprops
- リファクタリングの困難さ

### React Context
**利点:**
- Reactネイティブな解決策
- 型安全性の確保

**欠点:**
- 大量の状態更新でのパフォーマンス問題
- プロバイダーの階層化による複雑性
- 非同期処理の困難さ

### Redux/Zustand
**利点:**
- 中央集権的な状態管理
- 開発ツールの充実

**欠点:**
- ボイラープレートコードの増加
- 学習コストの高さ
- 小規模プロジェクトには過剰

### Observer Pattern
**利点:**
- 古典的で理解しやすいパターン
- 直接的な実装

**欠点:**
- メモリリークのリスク
- デバッグの困難さ
- 型安全性の確保が困難

## 影響

### 正の影響

1. **疎結合設計**: コンポーネント間の独立性向上
2. **拡張性**: 新機能追加時の既存コードへの影響最小化
3. **テスタビリティ**: イベント単位でのテストが可能
4. **デバッグ性**: イベントフローの可視化
5. **非同期処理**: 自然な非同期処理の実装

### 負の影響

1. **複雑性**: イベントフローの追跡が困難になる可能性
2. **型安全性**: 実行時エラーのリスク
3. **パフォーマンス**: 大量のイベント発火時のオーバーヘッド

### イベントフロー例

```typescript
// アイデア追加の完全なフロー
const ideaAdditionFlow = () => {
  // 1. ユーザーがフォームを送信
  emit(IdeaEvents.IDEA_ADDED, { id: '1', text: 'New idea' });
  
  // 2. PhyllotaxisSystemが位置を計算
  subscribe(IdeaEvents.IDEA_ADDED, (data) => {
    const position = calculatePosition(data.id);
    emit(IdeaEvents.POSITION_CALCULATED, { 
      entityId: data.id, 
      position 
    });
  });
  
  // 3. AnimationSystemがアニメーションを開始
  subscribe(IdeaEvents.POSITION_CALCULATED, (data) => {
    emit(SystemEvents.ANIMATION_START, { 
      entityId: data.entityId 
    });
  });
  
  // 4. RenderSystemが描画を更新
  subscribe(SystemEvents.ANIMATION_START, (data) => {
    emit(SystemEvents.RENDER_REQUESTED, { 
      entityId: data.entityId 
    });
  });
};
```

### エラーハンドリング

```typescript
// エラーイベントの統一処理
export const setupErrorHandling = (eventBus: EventBus) => {
  eventBus.on(SystemEvents.ERROR_OCCURRED, (error: ErrorEvent) => {
    console.error(`Error in ${error.source}:`, error.message);
    
    // エラー回復処理
    if (error.recoverable) {
      eventBus.emit(error.recoveryEvent, error.recoveryData);
    }
  });
};

// システムでのエラー発火
class PhyllotaxisSystem {
  update(entities: Entity[]): void {
    try {
      // 位置計算処理
    } catch (error) {
      eventBus.emit(SystemEvents.ERROR_OCCURRED, {
        source: 'PhyllotaxisSystem',
        message: error.message,
        recoverable: true,
        recoveryEvent: IdeaEvents.POSITION_CALCULATED,
        recoveryData: { /* デフォルト位置 */ }
      });
    }
  }
}
```

### パフォーマンス最適化

```typescript
// イベントのバッチ処理
class BatchedEventBus extends EventBusImpl {
  private batchQueue: Array<{ event: string; data: any }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  
  emit<T>(event: string, data: T): void {
    this.batchQueue.push({ event, data });
    
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch();
      }, 16); // 60fps
    }
  }
  
  private flushBatch(): void {
    this.batchQueue.forEach(({ event, data }) => {
      super.emit(event, data);
    });
    this.batchQueue = [];
    this.batchTimeout = null;
  }
}
```

## 関連文書

- [Event-Driven Architecture](https://en.wikipedia.org/wiki/Event-driven_architecture)
- [Observer Pattern](https://refactoring.guru/design-patterns/observer)
- [設計書: イベント駆動アーキテクチャ設計](../design.md#イベント駆動アーキテクチャ設計)
- [React Custom Hooks](https://reactjs.org/docs/hooks-custom.html)