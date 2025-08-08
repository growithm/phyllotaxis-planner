# テストディレクトリ構造設計書

## 概要

Phyllotaxis Plannerプロジェクトにおける包括的なテスト戦略を実現するため、単体テスト、統合テスト、E2Eテスト、パフォーマンステストを体系的に管理するディレクトリ構造を設計します。現在のVitestベースの単体テスト環境を拡張し、より堅牢なテスト基盤を構築します。

## アーキテクチャ

### 全体構造

```
tests/                      # 単体テスト以外のテスト（単体テストは既存のsrc内に配置済み）
├── integration/            # 統合テスト
│   ├── api/               # API統合テスト
│   ├── ecs-integration/   # ECSシステム間統合テスト
│   ├── event-flows/       # イベントフロー統合テスト
│   ├── phyllotaxis/       # フィロタキシス計算統合テスト
│   └── __fixtures__/      # 統合テスト用フィクスチャ
├── e2e/                   # E2Eテスト
│   ├── specs/             # テストスペック
│   │   ├── user-flows/    # ユーザーフローテスト
│   │   ├── visual/        # ビジュアルリグレッションテスト
│   │   └── performance/   # パフォーマンステスト
│   ├── fixtures/          # E2Eテスト用フィクスチャ
│   ├── page-objects/      # Page Objectパターン
│   └── utils/             # E2Eテスト用ユーティリティ
├── performance/           # パフォーマンステスト
│   ├── benchmarks/        # ベンチマークテスト
│   ├── load-tests/        # 負荷テスト
│   ├── memory-tests/      # メモリテスト
│   └── reports/           # パフォーマンスレポート
├── shared/                # 共通テストユーティリティ
│   ├── fixtures/          # 共通フィクスチャ
│   ├── mocks/             # モックデータ
│   ├── helpers/           # テストヘルパー関数
│   └── types/             # テスト用型定義
└── config/                # テスト設定ファイル
    ├── vitest.config.ts   # 単体テスト設定
    ├── playwright.config.ts # E2Eテスト設定
    ├── vitest.integration.config.ts # 統合テスト設定
    └── performance.config.js # パフォーマンステスト設定
```

## コンポーネントと インターフェース

### 1. 統合テスト層（Integration Tests）

**目的**: 複数のコンポーネントやシステム間の連携を検証

**技術スタック**:
- Vitest（テストランナー）
- React Testing Library（コンポーネント統合）
- MSW（API モッキング）

**構造**:
```typescript
// tests/integration/ecs-integration/EntityComponentSystem.test.ts
import { World } from '@/ecs/core/World';
import { PositionComponent } from '@/ecs/components/PositionComponent';
import { PhyllotaxisSystem } from '@/ecs/systems/PhyllotaxisSystem';

describe('ECS Integration', () => {
  it('should process entities through systems correctly', () => {
    const world = new World();
    const system = new PhyllotaxisSystem();
    // 統合テストロジック
  });
});
```

### 2. E2Eテスト層（End-to-End Tests）

**目的**: ユーザーの実際の操作フローを検証

**技術スタック**:
- Playwright（ブラウザ自動化）
- Page Object Model（テスト構造化）

**構造**:
```typescript
// tests/e2e/specs/user-flows/idea-management.spec.ts
import { test, expect } from '@playwright/test';
import { IdeaManagementPage } from '../page-objects/IdeaManagementPage';

test('should add and display new idea', async ({ page }) => {
  const ideaPage = new IdeaManagementPage(page);
  await ideaPage.goto();
  await ideaPage.addIdea('新しいアイデア');
  await expect(ideaPage.getIdeaNode('新しいアイデア')).toBeVisible();
});
```

### 3. パフォーマンステスト層（Performance Tests）

**目的**: アプリケーションの性能を測定・監視

**技術スタック**:
- Playwright（パフォーマンス測定）
- Lighthouse（Web Vitals）
- Custom benchmarks（カスタムベンチマーク）

## データモデル

### テストフィクスチャ構造

```typescript
// tests/shared/fixtures/phyllotaxis.ts
export const mockPhyllotaxisNodes = [
  {
    id: 'node-1',
    text: 'テストアイデア1',
    position: { x: 100, y: 100 },
    angle: 137.5,
    radius: 50
  },
  // ... more test data
];

// tests/shared/fixtures/ecs.ts
export const mockECSWorld = {
  entities: [
    { id: 1, components: ['Position', 'Phyllotaxis'] }
  ],
  components: {
    Position: { x: 0, y: 0 },
    Phyllotaxis: { angle: 137.5, radius: 10 }
  }
};
```

### モックデータ管理

```typescript
// tests/shared/mocks/api.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/ideas', (req, res, ctx) => {
    return res(ctx.json(mockPhyllotaxisNodes));
  }),
  rest.post('/api/ideas', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
];
```

## エラーハンドリング

### テスト失敗時の対応

1. **単体テスト失敗**:
   - 詳細なエラーメッセージとスタックトレース
   - カバレッジレポートでの影響範囲確認
   - 自動的なリトライ機能

2. **統合テスト失敗**:
   - システム間の依存関係の確認
   - モックデータの整合性チェック
   - ログ出力による詳細な診断情報

3. **E2Eテスト失敗**:
   - スクリーンショット自動保存
   - ビデオ録画による操作履歴
   - ブラウザコンソールログの収集

4. **パフォーマンステスト失敗**:
   - 性能劣化の詳細レポート
   - メモリ使用量の推移グラフ
   - 比較基準値との差分表示

### テストデータ管理

```typescript
// tests/shared/helpers/testDataManager.ts
export class TestDataManager {
  static async setupTestData() {
    // テストデータの初期化
  }
  
  static async cleanupTestData() {
    // テストデータのクリーンアップ
  }
  
  static generatePhyllotaxisData(count: number) {
    // フィロタキシステストデータの生成
  }
}
```

## テスト戦略

### 1. テストピラミッド

- **単体テスト（70%）**: 高速で安定、詳細な機能検証（既存のsrc内に配置）
- **統合テスト（20%）**: システム間連携の検証
- **E2Eテスト（10%）**: ユーザー体験の検証

### 2. 継続的インテグレーション

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:unit
  
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run test:e2e
```

### 3. テストカバレッジ目標

- **単体テスト**: 90%以上
- **統合テスト**: 主要フロー100%
- **E2Eテスト**: クリティカルパス100%

## 設定ファイル詳細

### Vitest設定（単体テスト）

```typescript
// tests/config/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['../shared/setup/vitest.setup.ts'],
    globals: true,
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@tests': path.resolve(__dirname, '..')
    }
  }
});
```

### Playwright設定（E2Eテスト）

```typescript
// tests/config/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

この設計により、Phyllotaxis Plannerプロジェクトは包括的で保守性の高いテスト基盤を持つことができ、品質の高いソフトウェア開発を継続的に行うことが可能になります。