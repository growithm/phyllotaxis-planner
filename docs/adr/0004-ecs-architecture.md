# ADR-0004: ECSアーキテクチャ採用の決定

## ステータス

承認済み

## コンテキスト

Phyllotaxis Plannerにおいて、アイデアノードとその関連データ（位置、テキスト、アニメーション状態など）を効率的に管理するアーキテクチャパターンの選択が必要でした。以下の要件を考慮する必要がありました：

- アイデアノードの複数の属性（位置、テキスト、アニメーション状態）の管理
- 異なるシステム（配置計算、アニメーション、描画）間でのデータ共有
- 将来的な機能拡張への対応力
- パフォーマンスの最適化
- コードの保守性と可読性
- テストの容易さ

## 決定

ECS（Entity Component System）アーキテクチャパターンを採用することを決定しました。

## 理由

### ECS採用の理由

1. **関心の分離**: データ（Component）とロジック（System）の明確な分離
2. **柔軟性**: 新しいコンポーネントやシステムの追加が容易
3. **再利用性**: コンポーネントとシステムの独立した再利用が可能
4. **パフォーマンス**: 必要なコンポーネントのみを処理するシステム設計
5. **テスタビリティ**: 各システムの独立したテストが可能
6. **スケーラビリティ**: エンティティ数の増加に対する効率的な処理

### ECS構成要素

#### Entity（エンティティ）
```typescript
// アイデアノードの識別子とコンポーネントコンテナ
interface Entity {
  id: string;
  components: Map<ComponentType, IComponent>;
}

class IdeaEntity implements Entity {
  id: string;
  components: Map<ComponentType, IComponent>;
  
  constructor(id: string, text: string) {
    this.id = id;
    this.components = new Map();
    this.addComponent(createTextComponent(text));
    this.addComponent(createPositionComponent());
    this.addComponent(createAnimationComponent());
  }
}
```

#### Component（コンポーネント）
```typescript
// データのみを保持するインターフェース
interface IPositionComponent extends IComponent {
  readonly type: 'position';
  x: number;
  y: number;
  angle: number;
  radius: number;
}

interface ITextComponent extends IComponent {
  readonly type: 'text';
  content: string;
  maxLength: number;
}

interface IAnimationComponent extends IComponent {
  readonly type: 'animation';
  isAnimating: boolean;
  duration: number;
  progress: number;
}
```

#### System（システム）
```typescript
// ロジックを担当するクラス
class PhyllotaxisSystem implements System {
  requiredComponents = ['position', 'text'];
  
  update(entities: Entity[], deltaTime: number): void {
    entities
      .filter(entity => this.hasRequiredComponents(entity))
      .forEach((entity, index) => {
        const position = getPositionComponent(entity);
        const newPos = calculatePhyllotaxisPosition(index);
        
        if (position) {
          position.x = newPos.x;
          position.y = newPos.y;
          position.angle = newPos.angle;
          position.radius = newPos.radius;
        }
      });
  }
}
```

## 代替案

### オブジェクト指向アプローチ
**利点:**
- 直感的な設計
- 継承による機能拡張

**欠点:**
- 継承階層の複雑化
- 機能の組み合わせが困難
- テストの複雑さ

```typescript
// 避けたいアプローチの例
class IdeaNode {
  position: Position;
  text: string;
  animation: AnimationState;
  
  updatePosition() { /* 位置更新ロジック */ }
  animate() { /* アニメーションロジック */ }
  render() { /* 描画ロジック */ }
}
```

### Redux/Zustand状態管理
**利点:**
- 中央集権的な状態管理
- 予測可能な状態変更

**欠点:**
- ボイラープレートコードの増加
- 複雑な状態更新ロジック
- パフォーマンスの課題

### React Context + Hooks
**利点:**
- Reactネイティブなアプローチ
- シンプルな実装

**欠点:**
- 大量データでのパフォーマンス問題
- 複雑な状態ロジックの管理困難

## 影響

### 正の影響

1. **モジュラリティ**: 機能の独立した開発とテスト
2. **拡張性**: 新機能の追加が既存コードに影響しない
3. **パフォーマンス**: 必要なデータのみを処理
4. **デバッグ性**: システム単位での問題の特定が容易
5. **再利用性**: コンポーネントとシステムの他プロジェクトでの再利用

### 負の影響

1. **学習コスト**: ECSパターンの理解が必要
2. **初期複雑性**: 小規模プロジェクトには過剰な可能性
3. **TypeScript複雑性**: 型安全性確保のための複雑な型定義

### 実装例

```typescript
// システムの協調動作例
class GameLoop {
  systems: System[] = [
    new PhyllotaxisSystem(),
    new AnimationSystem(),
    new RenderSystem()
  ];
  
  update(entities: Entity[], deltaTime: number): void {
    this.systems.forEach(system => {
      system.update(entities, deltaTime);
    });
  }
}

// React統合例
const PhyllotaxisMap: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const systemManager = useRef(new SystemManager());
  
  useEffect(() => {
    const gameLoop = () => {
      systemManager.current.update(entities, 16); // 60fps
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }, [entities]);
  
  return (
    <svg>
      {entities.map(entity => (
        <IdeaNodeComponent key={entity.id} entity={entity} />
      ))}
    </svg>
  );
};
```

### パフォーマンス考慮

```typescript
// システムの効率的な実行
class SystemManager {
  private systemCache = new Map<System, Entity[]>();
  
  update(entities: Entity[], deltaTime: number): void {
    this.systems.forEach(system => {
      // 必要なコンポーネントを持つエンティティのみをフィルタ
      const relevantEntities = entities.filter(entity =>
        system.requiredComponents.every(componentType =>
          entity.components.has(componentType)
        )
      );
      
      system.update(relevantEntities, deltaTime);
    });
  }
}
```

### 型安全性の確保

```typescript
// 型ガードによる安全なコンポーネントアクセス
export const getPositionComponent = (
  entity: Entity
): IPositionComponent | undefined => {
  const component = entity.components.get('position');
  return component && isPositionComponent(component) ? component : undefined;
};

export const isPositionComponent = (
  component: IComponent
): component is IPositionComponent =>
  component.type === 'position';
```

## 関連文書

- [ECS Architecture Pattern](https://en.wikipedia.org/wiki/Entity_component_system)
- [Game Programming Patterns - Component](https://gameprogrammingpatterns.com/component.html)
- [設計書: ECS設計](../design.md#ecs-entity-component-system-設計)
- [TypeScript Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)