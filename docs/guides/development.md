---
title: 開発環境セットアップガイド
type: guide
project: phyllotaxis-planner
status: active
created: 2025-02-08
tags: [development, setup, environment]
related:
  - "[[contributing]]"
  - "[[../architecture/system-overview]]"
---

# 開発環境セットアップガイド

このガイドでは、Phyllotaxis Plannerの開発環境をセットアップする手順を説明します。

## 前提条件

### 必須要件
- **Node.js**: 18.0.0以上
- **npm**: 8.0.0以上（またはyarn 1.22.0以上）
- **Git**: 最新版

### 推奨ツール
- **VS Code**: TypeScript、React開発に最適化
- **Chrome DevTools**: デバッグとパフォーマンス分析
- **Obsidian**: ドキュメント管理（docsフォルダ用）

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/phyllotaxis-planner.git
cd phyllotaxis-planner
```

### 2. 依存関係のインストール

```bash
# npm使用の場合
npm install

# yarn使用の場合
yarn install
```

### 3. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local

# 必要に応じて環境変数を編集
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて動作確認してください。

## 開発ツールの設定

### VS Code拡張機能

推奨拡張機能をインストールしてください：

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### ESLintとPrettierの設定

プロジェクトには既にESLintとPrettierが設定されています：

```bash
# コードフォーマット
npm run format

# リント実行
npm run lint

# リント自動修正
npm run lint:fix
```

## 開発ワークフロー

### ブランチ戦略

```bash
# 新機能開発
git checkout -b feature/your-feature-name

# バグ修正
git checkout -b fix/bug-description

# ドキュメント更新
git checkout -b docs/update-description
```

### コミット規約

[Conventional Commits](https://www.conventionalcommits.org/)に従ってください：

```bash
# 新機能
git commit -m "feat: add phyllotaxis calculation engine"

# バグ修正
git commit -m "fix: resolve SVG rendering issue on mobile"

# ドキュメント
git commit -m "docs: update API documentation"

# スタイル
git commit -m "style: improve component styling with Tailwind"

# テスト
git commit -m "test: add unit tests for phyllotaxis utils"
```

## テスト環境

### 単体テスト

```bash
# テスト実行
npm run test

# ウォッチモード
npm run test:watch

# カバレッジ確認
npm run test:coverage
```

### E2Eテスト

```bash
# E2Eテスト実行
npm run test:e2e

# UIモードで実行
npm run test:e2e:ui
```

### Storybook

```bash
# Storybook起動
npm run storybook

# Storybookビルド
npm run build-storybook
```

## デバッグ

### Next.js デバッグ

VS Codeでのデバッグ設定（`.vscode/launch.json`）：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### React DevTools

Chrome拡張機能「React Developer Tools」をインストールしてください。

## パフォーマンス監視

### Next.js Bundle Analyzer

```bash
# バンドルサイズ分析
npm run analyze
```

### Lighthouse

定期的にLighthouseスコアを確認してください：
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 90+

## トラブルシューティング

### よくある問題

#### Node.jsバージョンエラー
```bash
# nvmを使用してNode.jsバージョンを管理
nvm use 18
```

#### 依存関係の競合
```bash
# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### ポート競合
```bash
# 別のポートで起動
npm run dev -- -p 3001
```

### ログの確認

```bash
# 開発サーバーのログ
npm run dev

# ビルドログ
npm run build

# テストログ
npm run test -- --verbose
```

## 追加リソース

- [[contributing|コントリビューションガイド]]
- [[../architecture/system-overview|システム概要]]
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)