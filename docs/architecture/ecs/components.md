---
title: "ECSコンポーネント設計"
type: architecture
category: ecs
tags: [architecture, ecs, components, interfaces, factories]
related:
  - "[[entities]]"
  - "[[systems]]"
  - "[[overview]]"
  - "[[../../api/ecs-components]]"
created: 2025-02-08
updated: 2025-02-08
---

# ECSコンポーネント設計

> [!info] 概要
> Phyllotaxis PlannerのECSアーキテクチャにおけるコンポーネント設計の詳細を説明します。

## 設計原則

### 🎯 基本原則

> [!note] データのみ保持
> コンポーネントはデータのみを保持し、ロジックは一切含まない

```typescript
// ✅ 正しいコンポーネント設計
interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;
  x: number;
  y: number;
  angle: number;
  // データのみ
}

// ❌ 間違ったコンポーネント設計
interface BadComponent extends IComponent {
  calculateDistance(): number; // ロジックを含んではいけない
}
```

### 🏗️ コンポーネント構造

```typescript
// 基底インターフェース
export interface IComponent {
  readonly type: ComponentType;
}

// コンポーネントタイプ定義
export const ComponentTypes = {
  POSITION: 'position',
  TEXT: 'text',
  VISUAL: 'visual',
  ANIMATION: 'animation',
} as const;
```

## コンポーネント詳細仕様

### 📍 PositionComponent

**責務**: エンティティの位置情報とフィロタキシス配置データを管理

```typescript
interface IPositionComponent extends IComponent {
  // 基本位置情報
  x: number;                    // X座標（SVG座標系）
  y: number;                    // Y座標（SVG座標系）
  
  // フィロタキシス情報
  angle: number;                // 角度（度）
  radius: number;               // 中心からの距離
  index: number;                // 配置インデックス（0から始まる）
  
  // 表示制御
  scale: number;                // スケール（1.0が基準）
  zIndex: number;               // 描画順序
  
  // アニメーション用
  targetX?: number;             // 目標X座標
  targetY?: number;             // 目標Y座標
  isAnimating: boolean;         // アニメーション中フラグ
}
```

**特徴**:
- フィロタキシス配置用の`index`、`angle`、`radius`
- アニメーション目標位置の`targetX`、`targetY`
- 描画順序制御の`zIndex`

### 📝 TextComponent

**責務**: テキスト内容と表示設定、エンティティタイプ識別を管理

```typescript
interface ITextComponent extends IComponent {
  // テキスト内容
  content: string;              // 表示テキスト
  maxLength: number;            // 最大文字数制限
  
  // 編集制御
  isEditable: boolean;          // 編集可能フラグ
  placeholder?: string;         // プレースホルダー
  
  // 表示設定
  fontSize: number;             // フォントサイズ（px）
  fontFamily: string;           // フォントファミリー
  fontWeight: 'normal' | 'bold' | 'lighter' | number;
  color: string;                // テキスト色
  alignment: 'left' | 'center' | 'right';
  
  // エンティティ分類用
  entityType: 'idea' | 'theme'; // 重要：エンティティタイプ識別子
  
  // 拡張用
  tags?: string[];              // タグ
  category?: string;            // カテゴリ
}
```

**特徴**:
- `entityType`によるエンティティタイプ識別
- テーマとアイデアで異なるデフォルト値
- 将来の拡張を考慮した`tags`、`category`

### 🎨 VisualComponent

**責務**: SVG描画とスタイリング情報を管理

```typescript
interface IVisualComponent extends IComponent {
  // 基本表示制御
  visible: boolean;             // 表示フラグ
  opacity: number;              // 透明度（0.0-1.0）
  
  // 形状設定
  shape: 'circle' | 'ellipse' | 'rect' | 'leaf' | 'custom';
  width: number;                // 幅（px）
  height: number;               // 高さ（px）
  
  // 色設定
  fillColor: string;            // 塗りつぶし色
  strokeColor: string;          // 枠線色
  strokeWidth: number;          // 枠線幅
  
  // 高度な視覚効果
  gradient?: GradientConfig;    // グラデーション
  shadow?: ShadowConfig;        // 影
  
  // CSS連携
  cssClasses: string[];         // CSSクラス
  customStyles: Record<string, string>; // カスタムスタイル
  
  // SVG特有設定
  svgPath?: string;             // カスタムSVGパス
  svgAttributes?: Record<string, string>; // SVG属性
}
```

**特徴**:
- 豊富な形状オプション（`leaf`形状でアイデアを表現）
- グラデーションと影効果のサポート
- CSS統合とカスタムSVGパス

### 🎬 AnimationComponent

**責務**: アニメーション状態とCSS連携を管理

```typescript
interface IAnimationComponent extends IComponent {
  // アニメーション状態
  isAnimating: boolean;         // 実行中フラグ
  animationType: AnimationType; // アニメーションタイプ
  
  // タイミング制御
  duration: number;             // 時間（ミリ秒）
  delay: number;                // 開始遅延
  easing: EasingType;           // イージング関数
  
  // 進行状況
  progress: number;             // 進行状況（0.0-1.0）
  startTime?: number;           // 開始時刻
  endTime?: number;             // 終了予定時刻
  
  // 繰り返し制御
  loop: boolean;                // ループフラグ
  loopCount: number;            // ループ回数
  currentLoop: number;          // 現在のループ
  
  // CSS連携
  cssTransition?: string;       // CSS transitionプロパティ
  cssClasses: string[];         // アニメーション用CSSクラス
  
  // コールバック
  onStart?: () => void;         // 開始時
  onComplete?: () => void;      // 完了時
  onLoop?: () => void;          // ループ時
}
```

**特徴**:
- CSS transitionとの完全統合
- 詳細な進行状況追跡
- コールバック機能

## ファクトリパターン

### 🏭 基本ファクトリ関数

```typescript
// 基本的な作成
export const createPositionComponent = (
  x: number = 0,
  y: number = 0,
  options: Partial<Omit<IPositionComponent, 'type' | 'x' | 'y'>> = {}
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  ...DEFAULT_POSITION_COMPONENT,
  x,
  y,
  ...options,
});

// 特殊用途ファクトリ
export const createPhyllotaxisPositionComponent = (
  index: number,
  angle: number,
  radius: number,
  x: number,
  y: number
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  x, y, angle, radius, index,
  scale: 1.0,
  zIndex: index, // インデックスをzIndexとして使用
  isAnimating: false,
});
```

### 🎯 エンティティタイプ別ファクトリ

```typescript
// テーマ用
export const createThemeTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'theme', options);

// アイデア用
export const createIdeaTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'idea', options);
```

## 型ガードとヘルパー

### 🛡️ 型ガード関数

```typescript
export const isPositionComponent = (
  component: IComponent
): component is IPositionComponent =>
  component.type === ComponentTypes.POSITION;

export const isTextComponent = (
  component: IComponent
): component is ITextComponent => 
  component.type === ComponentTypes.TEXT;
```

### 🔧 ヘルパー関数

```typescript
// World経由でのコンポーネント取得
export const getPositionComponent = (
  world: IWorld,
  entityId: EntityId
): IPositionComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.POSITION);
  return component && isPositionComponent(component) ? component : undefined;
};

// エンティティタイプ判定
export const isThemeEntity = (
  world: IWorld,
  entityId: EntityId
): boolean => {
  const textComponent = getTextComponent(world, entityId);
  return textComponent?.entityType === 'theme';
};
```

## デフォルト値戦略

### 📋 階層化されたデフォルト値

```typescript
// 基本デフォルト値
export const DEFAULT_TEXT_COMPONENT = {
  maxLength: 100,
  isEditable: true,
  fontSize: 14,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontWeight: 'normal',
  color: '#374151',
  alignment: 'center',
};

// テーマ用デフォルト値（基本値を拡張）
export const DEFAULT_THEME_TEXT_COMPONENT = {
  ...DEFAULT_TEXT_COMPONENT,
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1F2937',
  placeholder: 'テーマを入力してください',
};
```

## 使用例

### 💡 実際の使用パターン

```typescript
// エンティティ作成時
const world = new World();

// テーマエンティティの作成
const themeEntityId = world.createEntity();
world.addComponent(themeEntityId, createThemeTextComponent('プロジェクト計画'));
world.addComponent(themeEntityId, createThemeVisualComponent());
world.addComponent(themeEntityId, createPositionComponent(400, 300));

// アイデアエンティティの作成
const ideaEntityId = world.createEntity();
world.addComponent(ideaEntityId, createIdeaTextComponent('要件定義'));
world.addComponent(ideaEntityId, createIdeaVisualComponent());
world.addComponent(ideaEntityId, createPhyllotaxisPositionComponent(0, 0, 50, 450, 300));
world.addComponent(ideaEntityId, createPositionAnimationComponent(300));

// コンポーネント取得と操作
const textComponent = getTextComponent(world, ideaEntityId);
if (textComponent) {
  textComponent.content = '更新された要件定義';
}

// エンティティタイプ判定
if (isIdeaEntity(world, ideaEntityId)) {
  console.log('これはアイデアエンティティです');
}
```

## 拡張性

### 🔮 将来の拡張ポイント

1. **新しいコンポーネントタイプ**:
   ```typescript
   // 将来追加予定
   INTERACTION: 'interaction',  // ユーザーインタラクション
   PHYSICS: 'physics',          // 物理演算
   AUDIO: 'audio',              // 音響効果
   ```

   > [!note] 実装状況
   > 現在は4つのコアコンポーネント（Position, Text, Visual, Animation）が実装済みです。
   > 各コンポーネントには包括的な単体テストが含まれており、86個のテストケースで品質を保証しています。

2. **コンポーネント間の関係**:
   ```typescript
   interface IRelationComponent extends IComponent {
     parentId?: EntityId;
     childIds: EntityId[];
     relationshipType: 'hierarchy' | 'association' | 'dependency';
   }
   ```

3. **動的プロパティ**:
   ```typescript
   interface IDynamicComponent extends IComponent {
     properties: Map<string, any>;
     schema: PropertySchema;
   }
   ```

## 関連文書

> [!info] 関連設計文書
> - [[entities|エンティティ設計]]
> - [[systems|システム設計]]
> - [[overview|ECS概要]]

> [!note] API仕様
> - [[../../api/ecs-components|コンポーネントAPI仕様]]