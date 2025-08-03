---
title: 設計書
type: design
project: phyllotaxis-planner
status: approved
created: 2025-02-08
tags: [design, architecture, nextjs, ecs, event-driven]
related:
  - '[[requirements]]'
  - '[[tasks]]'
---

# 設計書

> [!info] 関連ドキュメント
>
> - 要件定義: [[requirements]]
> - 実装計画: [[tasks]]

## 概要

Phyllotaxis Planner は、植物の葉序の法則を応用した Web ベースの思考整理ツールです。Next.js（App Router）、TypeScript、SVG、Tailwind CSS を使用して、ユーザーのアイデアを黄金角に基づいて美しく自動配置するインタラクティブなアプリケーションを構築します。

## アーキテクチャ

### アーキテクチャパターン

- **イベント駆動アーキテクチャ**: コンポーネント間の疎結合を実現
- **ECS (Entity Component System)**: アイデアノードの柔軟な管理
- **レイヤードアーキテクチャ**: 関心の分離による保守性向上

### 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **描画**: SVG (React JSX 内で直接記述)
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks (useState, useReducer)
- **テストフレームワーク**: Vitest + React Testing Library
- **E2E テスト**: Playwright
- **ドキュメント**: Storybook
- **ホスティング**: Vercel

### アプリケーション構造

```
├── README.md               # プロジェクトメインREADME
├── docs/                   # プロジェクト文書
│   ├── adr/                # Architecture Decision Records
│   │   ├── 0001-use-nextjs-15.md
│   │   ├── 0002-svg-over-canvas.md
│   │   └── 0003-phyllotaxis-algorithm.md
│   ├── architecture/       # アーキテクチャ図・設計文書
│   │   ├── system-overview.md
│   │   ├── component-diagram.md
│   │   └── data-flow.md
│   ├── api/                # API仕様書
│   │   └── components.md   # コンポーネントAPI
│   ├── assets/             # README用画像・動画
│   │   ├── demo.gif        # デモ動画
│   │   ├── phyllotaxis-pattern.png
│   │   └── screenshots/    # スクリーンショット
│   └── guides/             # 開発・運用ガイド
│       ├── development.md  # 開発環境セットアップ
│       ├── deployment.md   # デプロイメント手順
│       └── troubleshooting.md
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # メインページ
│   └── globals.css         # グローバルスタイル
├── components/
│   ├── PhyllotaxisMap.tsx  # メインマップコンポーネント
│   ├── CenterTheme.tsx     # 中心テーマコンポーネント
│   ├── IdeaNode.tsx        # アイデアノードコンポーネント
│   └── AddIdeaForm.tsx     # アイデア追加フォーム
├── ecs/                    # ECS関連
│   ├── components/         # ECSコンポーネント
│   │   ├── types/          # コンポーネントタイプ定義
│   │   │   └── ComponentTypes.ts
│   │   ├── interfaces/     # コンポーネントインターフェース
│   │   │   ├── IPositionComponent.ts
│   │   │   ├── ITextComponent.ts
│   │   │   └── IAnimationComponent.ts
│   │   ├── factories/      # コンポーネントファクトリ
│   │   │   ├── PositionComponentFactory.ts
│   │   │   ├── TextComponentFactory.ts
│   │   │   └── AnimationComponentFactory.ts
│   │   └── index.ts        # コンポーネントエクスポート
│   ├── entities/           # ECSエンティティ
│   │   ├── IdeaEntity.ts   # アイデアエンティティ
│   │   ├── ThemeEntity.ts  # テーマエンティティ
│   │   └── EntityManager.ts # エンティティ管理
│   ├── systems/            # ECSシステム
│   │   ├── PhyllotaxisSystem.ts # 配置計算システム
│   │   ├── AnimationSystem.ts   # アニメーションシステム
│   │   ├── RenderSystem.ts      # 描画システム
│   │   └── SystemManager.ts     # システム管理
│   └── core/               # ECSコア
│       ├── Entity.ts       # エンティティ基底クラス
│       ├── Component.ts    # コンポーネント基底インターフェース
│       ├── System.ts       # システム基底インターフェース
│       └── World.ts        # ECSワールド管理
├── events/                 # イベント定義
│   ├── IdeaEvents.ts       # アイデア関連イベント
│   └── SystemEvents.ts     # システムイベント
├── hooks/
│   ├── usePhyllotaxis.tsx  # フィロタキシス計算ロジック
│   └── useEventBus.tsx     # イベントバス管理
├── types/
│   └── index.ts            # 型定義
├── utils/
│   ├── phyllotaxis.ts      # フィロタキシス数学計算
│   └── eventBus.ts         # イベントバス実装
├── __tests__/              # テストファイル
│   ├── components/         # コンポーネントテスト
│   ├── hooks/              # フックテスト
│   └── utils/              # ユーティリティテスト
├── stories/                # Storybookストーリー
│   └── components/         # コンポーネントストーリー
└── e2e/                    # E2Eテスト
    └── phyllotaxis.spec.ts # メインフローテスト
```

## コンポーネントとインターフェース

### 1. PhyllotaxisMap (メインコンポーネント)

**責務**: アプリケーション全体の状態管理と描画領域の提供

**Props**: なし

**State**:

```typescript
interface AppState {
  centerTheme: string;
  ideas: Idea[];
  nextId: number;
}

interface Idea {
  id: number;
  text: string;
  position: Position;
  angle: number;
  radius: number;
}

interface Position {
  x: number;
  y: number;
}
```

### 2. CenterTheme (中心テーマコンポーネント)

**責務**: 中心テーマの表示と編集

**Props**:

```typescript
interface CenterThemeProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  position: Position;
}
```

### 3. IdeaNode (アイデアノードコンポーネント)

**責務**: 個別のアイデアの視覚的表現

**Props**:

```typescript
interface IdeaNodeProps {
  idea: Idea;
  isAnimating: boolean;
}
```

### 4. AddIdeaForm (アイデア追加フォーム)

**責務**: 新しいアイデアの入力と追加

**Props**:

```typescript
interface AddIdeaFormProps {
  onAddIdea: (text: string) => void;
  isDisabled: boolean;
}
```

## イベント駆動アーキテクチャ設計

### イベントバス実装

```typescript
// events/EventBus.ts
interface EventBus {
  emit<T>(event: string, data: T): void;
  on<T>(event: string, handler: (data: T) => void): () => void;
  off(event: string, handler: Function): void;
}

// イベント定義
enum IdeaEvents {
  IDEA_ADDED = 'idea:added',
  IDEA_REMOVED = 'idea:removed',
  IDEA_UPDATED = 'idea:updated',
  POSITION_CALCULATED = 'position:calculated',
}

enum SystemEvents {
  ANIMATION_START = 'animation:start',
  ANIMATION_END = 'animation:end',
  RENDER_REQUESTED = 'render:requested',
}
```

### イベントフロー

1. **アイデア追加**: `IDEA_ADDED` → `PhyllotaxisSystem` → `POSITION_CALCULATED` → `AnimationSystem` → `RenderSystem`
2. **配置計算**: `PhyllotaxisSystem`が新しい位置を計算し、`POSITION_CALCULATED`イベントを発火
3. **アニメーション**: `AnimationSystem`がアニメーション状態を管理
4. **描画更新**: `RenderSystem`が SVG 要素の更新を担当

## ECS (Entity Component System) 設計

### エンティティ管理

```typescript
// entities/Entity.ts
interface Entity {
  id: string;
  components: Map<string, Component>;
}

// entities/IdeaEntity.ts
class IdeaEntity implements Entity {
  id: string;
  components: Map<string, Component>;

  constructor(id: string, text: string) {
    this.id = id;
    this.components = new Map();
    this.addComponent(new TextComponent(text));
    this.addComponent(new PositionComponent(0, 0));
    this.addComponent(new AnimationComponent());
  }
}
```

### コンポーネント定義（インターフェースベース）

#### コンポーネントタイプ定義

```typescript
// ecs/components/types/ComponentTypes.ts
export const ComponentTypes = {
  POSITION: 'position',
  TEXT: 'text',
  ANIMATION: 'animation',
} as const;

export type ComponentType =
  (typeof ComponentTypes)[keyof typeof ComponentTypes];

// 型安全性のためのユニオン型
export type ComponentTypeUnion = 'position' | 'text' | 'animation';
```

#### 基底インターフェース

```typescript
// ecs/core/Component.ts
import type { ComponentType } from '../components/types/ComponentTypes';

interface IComponent {
  readonly type: ComponentType;
}
```

#### コンポーネントインターフェース

```typescript
// ecs/components/interfaces/IPositionComponent.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { IComponent } from '../../core/Component';

interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;
  x: number;
  y: number;
  angle: number;
  radius: number;
}

// ecs/components/interfaces/ITextComponent.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { IComponent } from '../../core/Component';

interface ITextComponent extends IComponent {
  readonly type: typeof ComponentTypes.TEXT;
  content: string;
  maxLength: number;
}

// ecs/components/interfaces/IAnimationComponent.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { IComponent } from '../../core/Component';

interface IAnimationComponent extends IComponent {
  readonly type: typeof ComponentTypes.ANIMATION;
  isAnimating: boolean;
  duration: number;
  easing: string;
  progress: number; // 0-1
}
```

#### ファクトリ関数実装

```typescript
// ecs/components/factories/PositionComponentFactory.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { IPositionComponent } from '../interfaces/IPositionComponent';

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

// ecs/components/factories/TextComponentFactory.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { ITextComponent } from '../interfaces/ITextComponent';

export const createTextComponent = (
  content: string,
  maxLength: number = 100
): ITextComponent => ({
  type: ComponentTypes.TEXT,
  content: content.slice(0, maxLength),
  maxLength,
});

// ecs/components/factories/AnimationComponentFactory.ts
import { ComponentTypes } from '../types/ComponentTypes';
import type { IAnimationComponent } from '../interfaces/IAnimationComponent';

export const createAnimationComponent = (
  duration: number = 500,
  easing: string = 'ease-out'
): IAnimationComponent => ({
  type: ComponentTypes.ANIMATION,
  isAnimating: false,
  duration,
  easing,
  progress: 0,
});
```

#### コンポーネント型ガード

```typescript
// ecs/components/index.ts
import { ComponentTypes } from './types/ComponentTypes';
import type { IComponent } from '../core/Component';
import type { IPositionComponent } from './interfaces/IPositionComponent';
import type { ITextComponent } from './interfaces/ITextComponent';
import type { IAnimationComponent } from './interfaces/IAnimationComponent';
import type { Entity } from '../core/Entity';

export const isPositionComponent = (
  component: IComponent
): component is IPositionComponent =>
  component.type === ComponentTypes.POSITION;

export const isTextComponent = (
  component: IComponent
): component is ITextComponent => component.type === ComponentTypes.TEXT;

export const isAnimationComponent = (
  component: IComponent
): component is IAnimationComponent =>
  component.type === ComponentTypes.ANIMATION;

// ヘルパー関数
export const getPositionComponent = (
  entity: Entity
): IPositionComponent | undefined => {
  const component = entity.components.get(ComponentTypes.POSITION);
  return component && isPositionComponent(component) ? component : undefined;
};

export const getTextComponent = (
  entity: Entity
): ITextComponent | undefined => {
  const component = entity.components.get(ComponentTypes.TEXT);
  return component && isTextComponent(component) ? component : undefined;
};

export const getAnimationComponent = (
  entity: Entity
): IAnimationComponent | undefined => {
  const component = entity.components.get(ComponentTypes.ANIMATION);
  return component && isAnimationComponent(component) ? component : undefined;
};
```

### システム実装

```typescript
// systems/System.ts
interface System {
  update(entities: Entity[], deltaTime: number): void;
  requiredComponents: string[];
}

// systems/PhyllotaxisSystem.ts
class PhyllotaxisSystem implements System {
  requiredComponents = ['position', 'text'];

  update(entities: Entity[], deltaTime: number): void {
    entities.forEach((entity, index) => {
      const position = entity.components.get('position') as PositionComponent;
      const newPos = this.calculatePhyllotaxisPosition(index);

      if (position.x !== newPos.x || position.y !== newPos.y) {
        position.x = newPos.x;
        position.y = newPos.y;
        position.angle = newPos.angle;
        position.radius = newPos.radius;

        eventBus.emit(IdeaEvents.POSITION_CALCULATED, {
          entityId: entity.id,
          position: newPos,
        });
      }
    });
  }
}

// systems/AnimationSystem.ts
class AnimationSystem implements System {
  requiredComponents = ['animation', 'position'];

  update(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      const animation = entity.components.get(
        'animation'
      ) as AnimationComponent;

      if (animation.isAnimating) {
        // アニメーション状態の更新
        this.updateAnimation(entity, deltaTime);
      }
    });
  }
}
```

## データモデル

### Idea 型

```typescript
interface Idea {
  id: number; // 一意識別子
  text: string; // アイデアのテキスト内容
  position: Position; // SVG座標系での位置
  angle: number; // フィロタキシス角度（度）
  radius: number; // 中心からの距離
  createdAt: Date; // 作成日時
}
```

### Position 型

```typescript
interface Position {
  x: number; // X座標
  y: number; // Y座標
}
```

### PhyllotaxisConfig 型

```typescript
interface PhyllotaxisConfig {
  goldenAngle: number; // 黄金角（137.5077640500378度）
  radiusScale: number; // 半径スケール係数
  centerX: number; // SVG中心X座標
  centerY: number; // SVG中心Y座標
  minRadius: number; // 最小半径
}
```

## エラーハンドリング

### 入力検証

- **空のアイデア**: ユーザーが空文字列を入力した場合、エラーメッセージを表示し追加を拒否
- **長すぎるテキスト**: 100 文字を超える入力の場合、警告を表示
- **中心テーマ未設定**: 中心テーマが設定されていない場合、プレースホルダーを表示

### 描画エラー

- **SVG 描画失敗**: SVG 要素の描画に失敗した場合、フォールバック表示を提供
- **位置計算エラー**: フィロタキシス計算でエラーが発生した場合、デフォルト位置を使用

### パフォーマンス制限

- **アイデア数上限**: MVP では 50 個までのアイデアに制限
- **アニメーション制御**: 大量のアイデアがある場合、アニメーションを簡略化

## テスト戦略

### 単体テスト (Vitest + React Testing Library)

- **フィロタキシス計算関数**:
  - 黄金角計算の精度テスト
  - 位置計算アルゴリズムの正確性テスト
  - 境界値テスト（index=0, 大きな値）
- **コンポーネントロジック**:
  - 各コンポーネントの状態変更とイベントハンドリングをテスト
  - プロパティの正しい受け渡しをテスト
  - 条件分岐とエラーハンドリングをテスト
- **入力検証**:
  - バリデーション関数の動作をテスト
  - エラーメッセージの表示をテスト
- **カスタムフック**:
  - usePhyllotaxis フックの状態管理をテスト
  - 副作用の正しい実行をテスト

### 統合テスト

- **アイデア追加フロー**: フォーム入力から配置までの一連の流れをテスト
- **レスポンシブ動作**: 異なる画面サイズでの表示をテスト
- **アニメーション**: 配置アニメーションの動作をテスト
- **SVG 描画**: SVG 要素の正しい生成と配置をテスト

### E2E テスト (Playwright)

- **基本ユーザーフロー**:
  - 中心テーマ設定 → アイデア追加 → 視覚確認の流れをテスト
  - 複数アイデア追加時の配置確認
  - エラーケースの動作確認
- **ブラウザ互換性**: Chrome、Firefox、Safari での動作をテスト
- **レスポンシブテスト**: デスクトップ、タブレット、モバイルでの表示をテスト
- **パフォーマンステスト**: 大量アイデア追加時の動作をテスト

### テスト設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', 'src/stories/', '**/*.d.ts'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## ドキュメント戦略

### Storybook 設定

- **コンポーネントストーリー**: 各 UI コンポーネントの様々な状態を文書化
- **インタラクティブドキュメント**: プロパティの動的変更による動作確認
- **デザインシステム**: 色、フォント、スペーシングの統一的な管理
- **アクセシビリティテスト**: a11y アドオンによる自動チェック

### API ドキュメント

- **TypeScript 型定義**: TSDoc コメントによる詳細な型説明
- **関数ドキュメント**: JSDoc による関数の使用方法と例
- **フィロタキシス計算**: 数学的背景と実装の詳細説明

### 開発者ガイド

- **セットアップガイド**: 開発環境の構築手順
- **コーディング規約**: TypeScript、React、Tailwind のベストプラクティス
- **コントリビューションガイド**: プルリクエストとコードレビューの流れ

### ユーザードキュメント

- **使用方法**: アプリケーションの基本的な使い方
- **フィロタキシスについて**: 植物の葉序の科学的背景の説明
- **FAQ**: よくある質問と回答

### 魅力的な README 設計

プロジェクトの第一印象を決める重要な要素として、視覚的に魅力的で情報豊富な README を作成します。

#### README 構成

```markdown
# 🌿 Phyllotaxis Planner

> 植物の葉序の法則で思考を美しく整理する

[デモ GIF - アイデアが螺旋状に配置される様子]

## ✨ 特徴

- 🌱 **自然な配置**: 黄金角 137.5° による有機的なレイアウト
- 🎨 **美しいアニメーション**: 思考が生き物のように成長
- 📱 **レスポンシブ**: あらゆるデバイスで快適な体験
- ⚡ **高速**: Next.js 15 による最適化されたパフォーマンス

## 🚀 クイックスタート

[インストールと起動の手順]

## 🧬 フィロタキシスとは？

[植物の葉序についての簡潔で魅力的な説明]

## 🛠️ 技術スタック

[技術選択の理由と共に紹介]

## 📸 スクリーンショット

[デスクトップ・モバイル・タブレットでの表示例]

## 🤝 コントリビューション

[開発参加の方法]

## 📄 ライセンス

[ライセンス情報]
```

#### 視覚的要素

- **ヒーロー GIF**: アプリケーションの核となる体験を 30 秒で示すデモ動画
- **フィロタキシスパターン図**: 数学的美しさを視覚化した図表
- **スクリーンショット**: 異なるデバイスでの表示例
- **技術スタック図**: 使用技術の関係性を示すダイアグラム
- **絵文字の効果的使用**: 親しみやすさと視認性の向上

#### コンテンツ戦略

- **ストーリーテリング**: 植物の成長になぞらえた説明
- **科学的背景**: フィロタキシスの魅力的な説明
- **実用性の強調**: 従来ツールとの差別化ポイント
- **開発者向け情報**: 技術的な詳細へのリンク

## Architecture Decision Records (ADR)

### 重要な設計決定の記録

プロジェクトの重要な技術的決定を体系的に記録し、将来の開発者が背景と理由を理解できるようにします。

#### 予定される ADR

1. **ADR-0001: Next.js 15 の採用**
   - 決定: Next.js 15 (App Router) を使用
   - 理由: 最新の React 機能、パフォーマンス向上、開発体験の改善
   - 代替案: Next.js 14、Vite + React、Remix
   - 影響: 最新機能の活用、長期サポート

2. **ADR-0002: SVG over Canvas**
   - 決定: 描画に SVG を使用、Canvas は使用しない
   - 理由: DOM 操作の容易さ、アクセシビリティ、CSS 統合
   - 代替案: HTML5 Canvas、WebGL
   - 影響: パフォーマンス制限、スケーラビリティ考慮

3. **ADR-0003: フィロタキシスアルゴリズム実装**
   - 決定: 黄金角 137.5° を使用した螺旋配置
   - 理由: 自然な配置、重複回避、美的効果
   - 代替案: グリッド配置、ランダム配置、力学シミュレーション
   - 影響: 計算複雑度、視覚的効果

### ADR テンプレート

```markdown
# ADR-XXXX: [決定のタイトル]

## ステータス

[提案中/承認済み/廃止]

## コンテキスト

[決定が必要になった背景と問題]

## 決定

[採用した解決策]

## 理由

[この決定を選んだ理由]

## 代替案

[検討した他の選択肢]

## 影響

[この決定による影響と制約]

## 関連文書

[関連するドキュメントやリンク]
```

## ドキュメント管理戦略

### 文書の分類と管理

- **ADR**: 技術的決定の記録、変更不可
- **Architecture**: システム設計、定期的な更新
- **API**: インターフェース仕様、バージョン管理
- **Guides**: 手順書、継続的な改善

### 文書の品質管理

- **レビュープロセス**: 全ての文書はプルリクエストでレビュー
- **更新頻度**: 月次でドキュメントの整合性確認
- **アクセシビリティ**: Markdown による統一フォーマット
- **検索性**: 適切なタグ付けとディレクトリ構造

## フィロタキシス実装詳細

### 数学的基礎

```typescript
// 黄金角の計算
const GOLDEN_ANGLE = 137.5077640500378; // 度

// n番目のアイデアの位置計算
function calculatePosition(index: number, config: PhyllotaxisConfig): Position {
  const angle = index * GOLDEN_ANGLE * (Math.PI / 180); // ラジアンに変換
  const radius = Math.sqrt(index) * config.radiusScale + config.minRadius;

  return {
    x: config.centerX + radius * Math.cos(angle),
    y: config.centerY + radius * Math.sin(angle),
  };
}
```

### SVG 描画戦略

- **ビューポート**: 動的にサイズ調整可能な SVG 要素を使用
- **座標系**: 中心を(0,0)とする座標系で計算し、SVG 座標系に変換
- **アニメーション**: CSS transitions と React の状態変更を組み合わせて実装

### レスポンシブ対応

- **ビューポート適応**: 画面サイズに応じて SVG サイズと配置パラメータを調整
- **タッチ対応**: モバイルデバイスでのタッチインタラクションを考慮
- **フォントサイズ**: デバイスに応じた読みやすいフォントサイズを設定
