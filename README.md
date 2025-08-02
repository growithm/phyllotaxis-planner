# 🌿 Phyllotaxis Planner

> 植物の葉序の法則で思考を美しく整理する

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC)](https://tailwindcss.com/)

## 🌱 概要

Phyllotaxis Plannerは、植物の葉序（Phyllotaxis）の法則を応用した有機的な思考整理ツールです。ユーザーが入力したアイデアやタスクが、自然の法則に従って美しく自動配置されることで、従来の無機質なタスク管理ツールとは一線を画す「思考を育てる」感覚を提供します。

## ✨ 特徴

- 🌱 **自然な配置**: 黄金角137.5°による有機的なレイアウト
- 🎨 **美しいアニメーション**: 思考が生き物のように成長
- 📱 **レスポンシブ**: あらゆるデバイスで快適な体験
- ⚡ **高速**: Next.js 15による最適化されたパフォーマンス
- 🧪 **テスト済み**: 包括的なテストカバレッジ

## 🧬 フィロタキシスとは？

フィロタキシス（葉序）は、植物の葉が茎に配置される規則的なパターンです。多くの植物は黄金角（約137.5°）を使用して葉を配置し、これにより各葉が最大限の日光を受けられるよう最適化されています。

この自然の法則をアイデア整理に応用することで、情報の重複を避けながら、視覚的に美しく、直感的に理解しやすい思考マップを作成できます。

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0.0以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/phyllotaxis-planner.git
cd phyllotaxis-planner

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認してください。

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **描画**: SVG
- **テスト**: Vitest + React Testing Library
- **E2Eテスト**: Playwright
- **ドキュメント**: Storybook
- **ホスティング**: Vercel

## 📁 プロジェクト構造

```
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reactコンポーネント
│   ├── ecs/                 # Entity Component System
│   ├── events/              # イベント定義
│   ├── hooks/               # カスタムフック
│   ├── types/               # TypeScript型定義
│   └── utils/               # ユーティリティ関数
├── docs/                    # プロジェクトドキュメント
├── __tests__/               # テストファイル
└── stories/                 # Storybookストーリー
```

## 🧪 テスト

```bash
# 単体テスト実行
npm run test

# E2Eテスト実行
npm run test:e2e

# テストカバレッジ確認
npm run test:coverage
```

## 📚 ドキュメント

- [要件定義書](.kiro/specs/phyllotaxis-planner/requirements.md)
- [設計書](.kiro/specs/phyllotaxis-planner/design.md)
- [実装計画](.kiro/specs/phyllotaxis-planner/tasks.md)
- [API仕様書](docs/api/)
- [アーキテクチャ決定記録](docs/adr/)

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](docs/guides/contributing.md) をご覧ください。

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🙏 謝辞

- フィロタキシスの数学的原理に関する研究
- Next.js、React、TypeScriptコミュニティ
- オープンソースソフトウェアの貢献者の皆様

---

**Made with 🌱 by the Phyllotaxis Planner Team**