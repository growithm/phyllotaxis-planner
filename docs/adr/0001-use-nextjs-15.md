---
title: "ADR-0001: Next.js 15の採用"
type: adr
status: approved
date: 2025-02-08
decision-makers: [development-team]
tags: [adr, nextjs, frontend, framework, architecture]
related:
  - "[[0002-svg-over-canvas]]"
  - "[[design]]"
  - "[[requirements]]"
---

# ADR-0001: Next.js 15の採用

> [!info] ステータス
> 承認済み

## コンテキスト

Phyllotaxis Plannerの開発において、フロントエンドフレームワークの選択が必要でした。以下の要件を満たす必要がありました：

- 高性能なWebアプリケーションの構築
- TypeScriptとの良好な統合
- SVG描画とReactコンポーネントの組み合わせ
- 将来的な拡張性とメンテナンス性
- 開発体験の向上
- SEOとパフォーマンスの最適化

## 決定

Next.js 15 (App Router) を採用することを決定しました。

## 理由

1. **最新のReact機能**: React 18の並行機能とSuspenseを活用可能
2. **App Router**: 新しいルーティングシステムによる柔軟なレイアウト管理
3. **パフォーマンス最適化**: 自動的なコード分割とイメージ最適化
4. **TypeScript統合**: 優れたTypeScriptサポートと型安全性
5. **開発体験**: Hot Reloadと豊富な開発ツール
6. **エコシステム**: 豊富なプラグインとコミュニティサポート
7. **Vercelデプロイ**: シームレスなデプロイメント体験

## 代替案

### Next.js 14 (Pages Router)
- 安定性は高いが、最新機能が利用できない
- App Routerの柔軟性が得られない

### Vite + React
- 高速な開発サーバー
- しかし、SSRやSEO最適化を自分で実装する必要がある

### Remix
- 優れたデータローディング機能
- しかし、エコシステムがNext.jsより小さい

### Create React App
- シンプルな設定
- しかし、パフォーマンス最適化や本番環境での制約が多い

## 影響

### 正の影響
- 最新のReact機能を活用した高性能なアプリケーション
- 優れた開発体験とデバッグ機能
- 自動的なパフォーマンス最適化
- 将来的な機能拡張への対応力

### 負の影響
- App Routerは比較的新しく、学習コストがある
- Next.js特有の設定や制約に依存
- バンドルサイズがピュアなReactより大きくなる可能性

### 技術的制約
- Next.jsのアップデート戦略に依存
- Vercel以外のホスティングでは一部機能が制限される可能性

## 関連文書

> [!note] 外部リンク
> - [Next.js 15 公式ドキュメント](https://nextjs.org/docs)
> - [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

> [!info] 内部文書
> - [[design#技術スタック|設計書: 技術スタック]]
> - [[0002-svg-over-canvas|ADR-0002: SVG over Canvas]]
> - [[requirements|要件定義書]]