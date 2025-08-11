# テスト設定ファイル

このディレクトリには、各種テストの設定ファイルを配置します。

## 設定ファイル一覧

### `vitest.integration.config.ts`
統合テスト用のVitest設定
- テスト対象: `tests/integration/**/*.test.ts`
- 実行環境: jsdom
- タイムアウト: 長め（10秒）

### `playwright.config.ts`
E2Eテスト用のPlaywright設定
- テスト対象: `tests/e2e/specs/**/*.spec.ts`
- ブラウザ: Chrome, Firefox, Safari
- スクリーンショット: 失敗時のみ

### `performance.config.js`
パフォーマンステスト用設定
- ベンチマーク閾値
- メモリ制限
- 測定項目

## 使用方法

```bash
# 統合テスト実行
npx vitest --config tests/config/vitest.integration.config.ts

# E2Eテスト実行
npx playwright test --config tests/config/playwright.config.ts

# パフォーマンステスト実行
npm run test:performance
```