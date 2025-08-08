# プロジェクト構造

## ディレクトリ構成

```
├── src/
│   ├── app/                 # Next.js App Router（ページとレイアウト）
│   ├── ecs/                 # Entity Component System アーキテクチャ
│   │   ├── components/      # ECSコンポーネント
│   │   ├── core/           # ECSコア機能
│   │   ├── entities/       # エンティティ定義
│   │   ├── systems/        # システム処理
│   │   └── query/          # クエリシステム
│   ├── events/             # イベントシステム
│   │   ├── core/           # イベントコア機能
│   │   ├── handlers/       # イベントハンドラー
│   │   └── types/          # イベント型定義
│   ├── hooks/              # Reactカスタムフック
│   ├── systems/            # アプリケーションシステム
│   ├── types/              # TypeScript型定義
│   │   ├── Phyllotaxis.ts  # フィロタキシス関連型
│   │   ├── Position.ts     # 位置情報型
│   │   └── Animation.ts    # アニメーション型
│   └── utils/              # ユーティリティ関数
│       └── phyllotaxis/    # フィロタキシス計算
├── docs/                   # プロジェクトドキュメント
│   ├── api/               # API仕様書
│   ├── architecture/      # アーキテクチャ設計
│   ├── adr/              # アーキテクチャ決定記録
│   └── guides/           # 開発ガイド
├── .kiro/                 # Kiro設定・仕様書
│   └── specs/            # プロジェクト仕様
└── coverage/             # テストカバレッジレポート
```

## アーキテクチャパターン

### Entity Component System (ECS)
- **Entity**: ゲームオブジェクトの識別子
- **Component**: データのみを持つ構造体
- **System**: コンポーネントを操作するロジック

### イベント駆動アーキテクチャ
- 疎結合なコンポーネント間通信
- `EventBusManager`による集中管理
- 型安全なイベント処理

## ファイル命名規則

- **コンポーネント**: PascalCase（例: `PhyllotaxisCanvas.tsx`）
- **フック**: camelCase + use接頭辞（例: `useEventBus.ts`）
- **ユーティリティ**: camelCase（例: `calculatePosition.ts`）
- **型定義**: PascalCase（例: `PhyllotaxisNode.ts`）
- **テストファイル**: `*.test.ts` または `*.spec.ts`

## インポートパス

TypeScriptパスマッピングを使用:
- `@/*`: `./src/*`
- `@/components/*`: `./src/components/*`
- `@/types/*`: `./src/types/*`
- `@/utils/*`: `./src/utils/*`
- `@/hooks/*`: `./src/hooks/*`