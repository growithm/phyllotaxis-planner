# 技術スタック

## フレームワーク・ライブラリ

- **Next.js 15**: App Routerを使用したモダンなReactフレームワーク
- **React 18**: UIライブラリ
- **TypeScript 5**: 型安全な開発言語
- **Tailwind CSS 3**: ユーティリティファーストのCSSフレームワーク

## 開発ツール

- **ESLint**: コード品質管理（TypeScript、React対応）
- **Prettier**: コードフォーマッター
- **Husky**: Git hooks管理
- **lint-staged**: ステージされたファイルのリント

## テスト環境

- **Vitest**: 単体テストフレームワーク
- **React Testing Library**: Reactコンポーネントテスト
- **Playwright**: E2Eテスト
- **Storybook**: コンポーネントドキュメント・テスト

## よく使用するコマンド

### 開発
```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
```

### コード品質
```bash
npm run lint         # ESLintチェック
npm run lint:fix     # ESLint自動修正
npm run format       # Prettierフォーマット
npm run type-check   # TypeScript型チェック
```

### テスト
```bash
npm run test         # 単体テスト実行
npm run test:ui      # テストUIモード
npm run test:coverage # カバレッジ付きテスト
npm run test:e2e     # E2Eテスト実行
```

### ドキュメント
```bash
npm run storybook    # Storybook起動
```

## 環境要件

- Node.js 18.0.0以上
- npm 8.0.0以上