# Phyllotaxis Planner テスト戦略・設計書

## 概要

Phyllotaxis Plannerプロジェクトの包括的なテスト戦略を定義し、ECSアーキテクチャとイベント駆動システムに特化したテスト構造を提供します。

## テストディレクトリ構造

```
tests/
├── integration/                    # 統合テスト
│   ├── ecs-systems/               # ECSシステム間統合テスト
│   ├── event-flows/               # イベントフロー統合テスト
│   ├── ecs-event-bridge/          # ECS-イベント連携テスト
│   └── phyllotaxis-rendering/     # フィロタキシス描画統合テスト
├── e2e/                           # E2Eテスト
│   ├── specs/
│   │   ├── user-flows/           # ユーザーフローテスト
│   │   └── visual-regression/    # ビジュアルリグレッションテスト
│   └── page-objects/             # Page Objectパターン
├── performance/                   # パフォーマンステスト
│   ├── ecs-performance/          # ECS処理性能テスト
│   ├── phyllotaxis-benchmarks/   # フィロタキシス計算ベンチマーク
│   └── memory-profiling/         # メモリプロファイリング
├── shared/                        # 共通テストユーティリティ
│   ├── fixtures/
│   │   ├── ecs-data/             # ECSテストデータ
│   │   └── phyllotaxis-data/     # フィロタキシステストデータ
│   ├── mocks/
│   │   └── event-mocks/          # イベントモック
│   └── helpers/
│       └── ecs-helpers/          # ECSテストヘルパー
└── config/                        # テスト設定ファイル
```

## テスト分類と責務

### 1. 単体テスト（Unit Tests）
**場所**: `src/*/__tests__/` (既存)
**責務**: 個別のクラス・関数の動作検証
**実行頻度**: 開発中・コミット時

**現在の実装状況**:
- ✅ ECSコンポーネント: `src/ecs/components/__tests__/`
- ✅ ECSコア機能: `src/ecs/core/__tests__/`
- ✅ ECSエンティティ: `src/ecs/entities/__tests__/`
- ✅ ECSシステム: `src/ecs/systems/__tests__/`
- ✅ イベントシステム: `src/events/*/__tests__/`

### 2. 統合テスト（Integration Tests）
**場所**: `tests/integration/`
**責務**: 複数コンポーネント間の連携検証
**実行頻度**: プルリクエスト時・デプロイ前

#### 2.1 ECSシステム間統合テスト (`ecs-systems/`)
**テスト観点**:
- Entity-Component-System間の完全なライフサイクル
- 複数システムの協調動作
- コンポーネント依存関係の解決
- World状態の整合性

**具体例**:
```typescript
// PhyllotaxisSystem + AnimationSystem + RenderSystemの連携
describe('ECS Systems Integration', () => {
  it('should process phyllotaxis calculation through animation to rendering', () => {
    // フィロタキシス計算 → アニメーション → 描画の一連の流れ
  });
});
```

#### 2.2 イベントフロー統合テスト (`event-flows/`)
**テスト観点**:
- イベントの発火から処理完了までの流れ
- イベントハンドラーチェーンの動作
- エラーハンドリングとリカバリ
- イベントフィルタリングと最適化

**具体例**:
```typescript
// アイデア追加イベントの完全フロー
describe('Idea Addition Event Flow', () => {
  it('should handle idea creation from event to ECS entity creation', () => {
    // IdeaAddedEvent → EntityCreation → ComponentAttachment → SystemProcessing
  });
});
```

#### 2.3 ECS-イベント連携テスト (`ecs-event-bridge/`)
**テスト観点**:
- ECSシステムからのイベント発火
- イベントによるECS状態変更
- 双方向データフローの整合性
- パフォーマンス影響の検証

#### 2.4 フィロタキシス描画統合テスト (`phyllotaxis-rendering/`)
**テスト観点**:
- 数学的計算からSVG描画までの精度
- アニメーション遷移の滑らかさ
- 大量ノード処理時の描画品質
- レスポンシブ対応の検証

### 3. E2Eテスト（End-to-End Tests）
**場所**: `tests/e2e/`
**責務**: ユーザー視点での機能検証
**実行頻度**: リリース前・定期実行

#### 3.1 ユーザーフローテスト (`specs/user-flows/`)
**テスト観点**:
- アイデア追加・編集・削除の操作フロー
- フィロタキシス表示の動的更新
- ユーザーインタラクションの応答性
- エラー状態からの回復

**具体例**:
```typescript
test('Idea Management Flow', async ({ page }) => {
  // 1. アイデア追加
  await page.fill('[data-testid="idea-input"]', '新しいアイデア');
  await page.click('[data-testid="add-button"]');
  
  // 2. フィロタキシス表示確認
  await expect(page.locator('[data-testid="phyllotaxis-node"]')).toBeVisible();
  
  // 3. アニメーション完了待機
  await page.waitForTimeout(1000);
  
  // 4. 位置計算の検証
  const nodePosition = await page.locator('[data-testid="phyllotaxis-node"]').boundingBox();
  expect(nodePosition).toBeTruthy();
});
```

#### 3.2 ビジュアルリグレッションテスト (`specs/visual-regression/`)
**テスト観点**:
- フィロタキシスパターンの視覚的正確性
- アニメーション品質の維持
- レスポンシブデザインの一貫性
- ブラウザ間の表示差異

### 4. パフォーマンステスト（Performance Tests）
**場所**: `tests/performance/`
**責務**: 性能要件の検証
**実行頻度**: リリース前・定期監視

#### 4.1 ECS処理性能テスト (`ecs-performance/`)
**テスト観点**:
- 大量エンティティ処理時のフレームレート
- システム実行時間の測定
- コンポーネント操作のスループット
- メモリ使用効率

**測定指標**:
- 1000エンティティ処理時間 < 16ms (60FPS維持)
- メモリ使用量の線形増加確認
- ガベージコレクション頻度

#### 4.2 フィロタキシス計算ベンチマーク (`phyllotaxis-benchmarks/`)
**テスト観点**:
- 黄金角計算の精度と速度
- 座標変換処理の最適化
- 大量ノード配置時の計算時間
- 数値精度の維持

#### 4.3 メモリプロファイリング (`memory-profiling/`)
**テスト観点**:
- メモリリークの検出
- オブジェクトプールの効率性
- 長時間実行時の安定性
- ブラウザメモリ制限への対応

## 共通テストユーティリティ

### フィクスチャデータ (`shared/fixtures/`)
```typescript
// ecs-data/: ECS用テストデータ
export const mockWorld = {
  entities: [/* ... */],
  components: [/* ... */],
  systems: [/* ... */]
};

// phyllotaxis-data/: フィロタキシス用テストデータ
export const mockPhyllotaxisNodes = [
  { angle: 137.5, radius: 10, position: { x: 0, y: 0 } },
  // ...
];
```

### モックデータ (`shared/mocks/`)
```typescript
// event-mocks/: イベントシステムモック
export const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};
```

### テストヘルパー (`shared/helpers/`)
```typescript
// ecs-helpers/: ECSテスト用ヘルパー
export class ECSTestHelper {
  static createMockWorld(): World { /* ... */ }
  static addMockEntity(world: World, components: Component[]): EntityId { /* ... */ }
  static runSystemsOnce(world: World): void { /* ... */ }
}
```

## テスト実行戦略

### 開発時
```bash
npm run test:unit        # 単体テスト（高速）
npm run test:integration # 統合テスト（中速）
```

### CI/CD時
```bash
npm run test:all         # 全テスト実行
npm run test:e2e         # E2Eテスト
npm run test:performance # パフォーマンステスト
```

### 品質ゲート
- 単体テスト: カバレッジ90%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%
- パフォーマンス: 基準値以内

## 今後の拡張計画

1. **Phase 1**: 統合テストの充実
   - ECS-イベント連携テストの実装
   - フィロタキシス描画統合テストの作成

2. **Phase 2**: E2Eテストの構築
   - Page Objectパターンの実装
   - ビジュアルリグレッションテストの導入

3. **Phase 3**: パフォーマンス監視
   - 継続的パフォーマンス測定
   - アラート機能の実装

この設計により、Phyllotaxis Plannerの複雑なアーキテクチャを適切にテストし、品質を継続的に保証できます。