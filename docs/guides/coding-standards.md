---
title: コーディング規約とベストプラクティス
type: guide
project: phyllotaxis-planner
status: active
created: 2025-02-08
updated: 2025-02-08
tags: [coding-standards, best-practices, typescript, react, nextjs]
related:
  - "[[development]]"
  - "[[contributing]]"
---

# コーディング規約とベストプラクティス

このドキュメントでは、Phyllotaxis Plannerプロジェクトでのコーディング規約とベストプラクティスを定義します。

> [!note] 生きた文書
> この規約は「生きた文書」として、プロジェクトの成長と共に継続的に更新されます。

## TypeScript規約

### インポート規約

**パスエイリアス**: 相対パス（`../`）ではなく、パスエイリアス（`@/`）を使用する

```typescript
// ✅ Good: パスエイリアスを使用
import { ComponentTypes } from '@/ecs/core/Component';
import { World } from '@/ecs/core/World';
import { Button } from '@/components/ui/Button';

// ❌ Bad: 相対パスを使用
import { ComponentTypes } from '../../../ecs/core/Component';
import { World } from '../../core/World';
import { Button } from '../ui/Button';
```

**利用可能なパスエイリアス**:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/types/*`
- `@/utils/*` → `./src/utils/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/styles/*` → `./src/styles/*`

### 型定義

```typescript
// ✅ Good: 明確で説明的な型名
interface PhyllotaxisConfig {
  goldenAngle: number;
  radiusScale: number;
  centerX: number;
  centerY: number;
}

// ❌ Bad: 曖昧な型名
interface Config {
  angle: number;
  scale: number;
  x: number;
  y: number;
}
```

### インターフェース vs タイプエイリアス

**判断基準**: 拡張性を考慮する場合は`interface`、ユニオン型やプリミティブには`type`を使用

```typescript
// ✅ Good: オブジェクトの形状にはinterface（拡張性を考慮）
interface IdeaNode {
  id: string;
  text: string;
  position: Position;
}

// ✅ Good: interfaceは同名宣言でプロパティをマージ（拡張）可能
interface IdeaNode {
  createdAt: Date; // 既存のIdeaNodeに追加される
}

// ✅ Good: ユニオン型やプリミティブにはtype
type Status = 'idle' | 'loading' | 'success' | 'error';
type EventHandler = (event: CustomEvent) => void;
```

### 不変性（Immutability）の促進

```typescript
// ✅ Good: 変更されるべきでないプロパティにreadonlyを付与
interface User {
  readonly id: string;
  readonly createdAt: Date;
  name: string; // 変更可能
}

// ✅ Good: 配列の不変性
interface Config {
  readonly items: readonly string[];
}
```

### 関数の型定義

```typescript
// ✅ Good: 明確な引数と戻り値の型
function calculatePhyllotaxisPosition(
  index: number,
  config: PhyllotaxisConfig
): Position {
  // implementation
}

// ✅ Good: アロー関数での型定義
const validateIdea = (text: string): ValidationResult => {
  // implementation
};
```

## React規約

### コンポーネント定義

```typescript
// ✅ Good: 関数コンポーネントの推奨形式
interface IdeaNodeProps {
  idea: Idea;
  onUpdate?: (idea: Idea) => void;
  className?: string;
}

export const IdeaNode: React.FC<IdeaNodeProps> = ({
  idea,
  onUpdate,
  className = ''
}) => {
  // implementation
};
```

### Propsの透過的な引き渡し

```typescript
// ✅ Good: ネイティブHTML属性を透過的に渡す
import { ComponentPropsWithoutRef } from 'react';

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary';
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  ...rest // disabled, onClick などもここに含まれる
}) => {
  const combinedClassName = `btn btn-${variant} ${className || ''}`;

  return (
    <button className={combinedClassName} {...rest}>
      {children}
    </button>
  );
};
```

### Hooks使用規約

**重要**: カスタムフックは必ず`use`で始める

```typescript
// ✅ Good: カスタムフックの命名と型定義
export const usePhyllotaxis = (
  ideas: Idea[]
): {
  positions: Position[];
  addIdea: (text: string) => void;
  removeIdea: (id: string) => void;
} => {
  // implementation
};

// ✅ Good: useEffectの依存配列を明確に
useEffect(() => {
  calculatePositions();
}, [ideas, config]); // 依存関係を明示
```

### イベントハンドリング

```typescript
// ✅ Good: 型安全なイベントハンドラ
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  // implementation
};

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setValue(event.target.value);
};
```

## Next.js規約

### サーバーコンポーネント vs クライアントコンポーネント

**原則**: デフォルトのサーバーコンポーネントを基本とし、必要な場合にのみクライアントコンポーネント（`'use client'`）を使用

**`'use client'`を使用するケース**:
- `useState`, `useEffect`などのHooksを使用する場合
- `onClick`などのイベントリスナーを必要とする場合
- ブラウザ専用API（`window`など）に依存する場合

```typescript
// ✅ Good: サーバーコンポーネント（デフォルト）
export default async function IdeaList() {
  const ideas = await fetchIdeas(); // サーバーサイドでデータ取得
  
  return (
    <div>
      {ideas.map(idea => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}

// ✅ Good: クライアントコンポーネント（必要な場合のみ）
'use client';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### データフェッチ戦略

```typescript
// ✅ Good: Next.js拡張fetchでキャッシング制御
const response = await fetch('/api/data', {
  next: { revalidate: 3600 } // 1時間ごとにデータを再検証（ISR）
});

// ✅ Good: 静的データの場合
const staticResponse = await fetch('/api/static-data', {
  cache: 'force-cache' // ビルド時にキャッシュ
});
```

## ECS (Entity Component System) 規約

### コンポーネント定義

```typescript
// ✅ Good: インターフェースベースのコンポーネント
interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;
  x: number;
  y: number;
  angle: number;
  radius: number;
}

// ✅ Good: ファクトリ関数
export const createPositionComponent = (
  x: number = 0,
  y: number = 0,
  angle: number = 0,
  radius: number = 0
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  x,
  y,
  angle,
  radius,
});
```

### システム実装

```typescript
// ✅ Good: システムクラスの実装
export class PhyllotaxisSystem implements ISystem {
  readonly requiredComponents = [ComponentTypes.POSITION, ComponentTypes.TEXT];

  update(entities: Entity[], deltaTime: number): void {
    entities.forEach((entity, index) => {
      // implementation
    });
  }
}
```

## スタイリング規約

### Tailwind CSS

**`cn`ユーティリティについて**: `clsx`と`tailwind-merge`を組み合わせたユーティリティ関数で、条件付きクラス名の結合と競合するTailwindクラスの解決を行います。

```typescript
// ✅ Good: cnユーティリティを使用した条件付きクラス名
import { cn } from '@/utils/cn';

const buttonClasses = cn(
  'px-4 py-2 rounded-md font-medium transition-colors',
  {
    'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
    'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
  },
  className
);

// ✅ Good: レスポンシブデザイン
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### CSS-in-JS（必要な場合のみ）

```typescript
// ✅ Good: 動的スタイルが必要な場合のみ使用
const nodeStyle: React.CSSProperties = {
  transform: `translate(${position.x}px, ${position.y}px) rotate(${angle}deg)`,
  transition: 'transform 0.3s ease-out',
};
```

## テスト規約

### テスト対象の線引き

**単体テスト**:
- 個々のコンポーネントの表示
- propsに応じた変化
- ユーザーインタラクション（クリックなど）の検証

**E2Eテスト**:
- 複数のコンポーネントやページ、APIをまたぐ一連のユーザーシナリオ
- ユーザーストーリー全体の検証

### 単体テスト

```typescript
// ✅ Good: 明確なテスト名と構造
describe('PhyllotaxisUtils', () => {
  describe('calculatePosition', () => {
    it('should return correct position for index 0', () => {
      const config = createDefaultConfig();
      const position = calculatePosition(0, config);
      
      expect(position.x).toBe(config.centerX);
      expect(position.y).toBe(config.centerY);
    });

    it('should calculate spiral positions using golden angle', () => {
      // test implementation
    });
  });
});
```

### コンポーネントテスト

```typescript
// ✅ Good: ユーザー中心のテスト
describe('IdeaNode', () => {
  it('should display idea text', () => {
    const idea = createMockIdea({ text: 'Test Idea' });
    render(<IdeaNode idea={idea} />);
    
    expect(screen.getByText('Test Idea')).toBeInTheDocument();
  });

  it('should call onUpdate when edited', async () => {
    const onUpdate = vi.fn();
    const idea = createMockIdea();
    render(<IdeaNode idea={idea} onUpdate={onUpdate} />);
    
    await user.click(screen.getByRole('button', { name: /edit/i }));
    // test implementation
  });
});
```

### モック戦略

**推奨**: Mock Service Worker (MSW)を使用してAPIリクエストをモック

```typescript
// ✅ Good: MSWを使用したAPIモック
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/ideas', (req, res, ctx) => {
    return res(ctx.json([{ id: '1', text: 'Test Idea' }]));
  })
);
```

## パフォーマンス規約

### React最適化

```typescript
// ✅ Good: メモ化の適切な使用
const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  const handleUpdate = useCallback((newData: Data) => {
    onUpdate(newData);
  }, [onUpdate]);

  return <div>{/* component JSX */}</div>;
});
```

### 遅延読み込み

```typescript
// ✅ Good: 動的インポート
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// ✅ Good: Suspenseでラップ
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

## エラーハンドリング規約

### エラー境界

```typescript
// ✅ Good: エラー境界の実装
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

### 非同期エラーハンドリング

```typescript
// ✅ Good: try-catch with proper error typing
const fetchData = async (): Promise<Data | null> => {
  try {
    const response = await api.getData();
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    return null;
  }
};
```

## Git規約

### Conventional Commits

このプロジェクトでは[Conventional Commits](https://www.conventionalcommits.org/)規約に従います。

### ブランチ命名規約

```bash
# 新機能
feature/add-phyllotaxis-animation
feature/implement-ecs-system

# バグ修正
fix/svg-rendering-mobile
fix/memory-leak-in-animation

# ドキュメント
docs/update-api-documentation
docs/add-contributing-guide

# リファクタリング
refactor/simplify-component-structure
refactor/optimize-phyllotaxis-calculation

# テスト
test/add-unit-tests-for-utils
test/improve-e2e-coverage
```

### コミットメッセージ

```bash
# 基本形式
<type>[optional scope]: <description>

# 例
feat: add phyllotaxis position calculation
fix(animation): resolve SVG rendering issue on mobile
docs: update API documentation for ECS components
style: improve button hover states
test: add unit tests for phyllotaxis utils
refactor: simplify component prop interfaces
perf: optimize rendering performance for large datasets
```

## ドキュメント規約

### JSDoc

```typescript
/**
 * Calculates the position of an idea node using phyllotaxis pattern
 * @param index - The sequential index of the idea (0-based)
 * @param config - Configuration object for phyllotaxis calculation
 * @returns Position object with x, y coordinates and angle
 * @example
 * ```typescript
 * const position = calculatePosition(5, defaultConfig);
 * console.log(position); // { x: 120, y: 80, angle: 687.5 }
 * ```
 */
export function calculatePosition(
  index: number,
  config: PhyllotaxisConfig
): Position {
  // implementation
}
```

### README更新

```markdown
<!-- ✅ Good: 明確な使用例 -->
## Usage

```typescript
import { usePhyllotaxis } from './hooks/usePhyllotaxis';

const MyComponent = () => {
  const { positions, addIdea } = usePhyllotaxis([]);
  
  return (
    <div>
      {positions.map((pos, index) => (
        <IdeaNode key={index} position={pos} />
      ))}
    </div>
  );
};
```

## コードレビュー規約

### チェックリスト

- [ ] 型安全性が確保されている
- [ ] パフォーマンスへの配慮がある
- [ ] テストが適切に書かれている
- [ ] アクセシビリティが考慮されている
- [ ] エラーハンドリングが適切
- [ ] ドキュメントが更新されている

### レビューコメント例

```typescript
// 💡 Suggestion: Consider using useMemo for expensive calculations
const result = expensiveCalculation(data);

// ⚠️ Warning: This could cause memory leaks
useEffect(() => {
  // missing cleanup
}, []);

// ✅ Approved: Good use of TypeScript generics
function createEntity<T extends Component>(components: T[]): Entity<T> {
  // implementation
}
```

## 継続的改善

このドキュメントは定期的に見直し、プロジェクトの成長に合わせて更新していきます。

新しいベストプラクティスや規約の提案は、[[contributing|コントリビューションガイド]]に従ってプルリクエストで提出してください。

---

> [!tip] 参考リンク
> - [Conventional Commits](https://www.conventionalcommits.org/)
> - [TypeScript Handbook](https://www.typescriptlang.org/docs/)
> - [React Documentation](https://react.dev/)
> - [Next.js Documentation](https://nextjs.org/docs)
> - [Tailwind CSS Documentation](https://tailwindcss.com/docs)