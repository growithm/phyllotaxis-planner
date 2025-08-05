---
title: "ECSコンポーネントAPI仕様"
type: api
category: ecs
tags: [api, ecs, components, interfaces, typescript]
related:
  - "[[ecs-systems]]"
  - "[[../architecture/ecs/components]]"
created: 2025-02-08
---

# ECSコンポーネントAPI仕様

> [!info] 概要
> Entity Component System (ECS) アーキテクチャのコンポーネントAPI仕様を定義します。

## コンポーネントタイプ定義

```typescript
// ecs/core/Component.ts
export const ComponentTypes = {
  POSITION: 'position',
  TEXT: 'text',
  VISUAL: 'visual',
  ANIMATION: 'animation',
} as const;

export type ComponentType = typeof ComponentTypes[keyof typeof ComponentTypes];

export interface IComponent {
  readonly type: ComponentType;
}
```

## PositionComponent

### インターフェース

```typescript
interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;
  
  // 基本位置情報
  x: number;                    // X座標（SVG座標系）
  y: number;                    // Y座標（SVG座標系）
  
  // フィロタキシス情報
  angle: number;                // 角度（度）- フィロタキシス計算で使用
  radius: number;               // 中心からの距離
  index: number;                // フィロタキシス配置インデックス（0から始まる）
  
  // 表示制御
  scale: number;                // スケール（1.0が基準）
  zIndex: number;               // 描画順序（大きいほど前面）
  
  // アニメーション用
  targetX?: number;             // アニメーション目標X座標
  targetY?: number;             // アニメーション目標Y座標
  isAnimating: boolean;         // アニメーション中かどうか
}
```

### デフォルト値

```typescript
export const DEFAULT_POSITION_COMPONENT: Omit<IPositionComponent, 'type'> = {
  x: 0,
  y: 0,
  angle: 0,
  radius: 0,
  index: 0,
  scale: 1.0,
  zIndex: 0,
  isAnimating: false,
};
```

### ファクトリ関数

```typescript
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

// フィロタキシス用の特別なファクトリ
export const createPhyllotaxisPositionComponent = (
  index: number,
  angle: number,
  radius: number,
  x: number,
  y: number
): IPositionComponent => ({
  type: ComponentTypes.POSITION,
  x,
  y,
  angle,
  radius,
  index,
  scale: 1.0,
  zIndex: index, // インデックスをzIndexとして使用
  isAnimating: false,
});
```

## TextComponent

### インターフェース

```typescript
interface ITextComponent extends IComponent {
  readonly type: typeof ComponentTypes.TEXT;
  
  // テキスト内容
  content: string;              // 表示するテキスト内容
  maxLength: number;            // 最大文字数制限
  
  // 編集制御
  isEditable: boolean;          // 編集可能かどうか
  placeholder?: string;         // プレースホルダーテキスト
  
  // 表示設定
  fontSize: number;             // フォントサイズ（px）
  fontFamily: string;           // フォントファミリー
  fontWeight: 'normal' | 'bold' | 'lighter' | number; // フォント太さ
  color: string;                // テキスト色（CSS色値）
  alignment: 'left' | 'center' | 'right'; // テキスト配置
  
  // エンティティ分類用
  entityType: 'idea' | 'theme'; // エンティティタイプ識別子
  
  // 検索・フィルタリング用
  tags?: string[];              // タグ（将来の拡張用）
  category?: string;            // カテゴリ（将来の拡張用）
}
```

### デフォルト値

```typescript
export const DEFAULT_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  maxLength: 100,
  isEditable: true,
  fontSize: 14,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontWeight: 'normal',
  color: '#374151',
  alignment: 'center',
};

export const DEFAULT_THEME_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  ...DEFAULT_TEXT_COMPONENT,
  fontSize: 20,
  fontWeight: 'bold',
  color: '#1F2937',
  placeholder: 'テーマを入力してください',
};

export const DEFAULT_IDEA_TEXT_COMPONENT: Omit<ITextComponent, 'type' | 'content' | 'entityType'> = {
  ...DEFAULT_TEXT_COMPONENT,
  fontSize: 14,
  fontWeight: 'normal',
  color: '#374151',
};
```

### ファクトリ関数

```typescript
export const createTextComponent = (
  content: string,
  entityType: 'idea' | 'theme',
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => {
  const baseDefaults = entityType === 'theme' 
    ? DEFAULT_THEME_TEXT_COMPONENT 
    : DEFAULT_IDEA_TEXT_COMPONENT;
    
  return {
    type: ComponentTypes.TEXT,
    content: content.slice(0, options.maxLength || baseDefaults.maxLength),
    entityType,
    ...baseDefaults,
    ...options,
  };
};

export const createThemeTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'theme', options);

export const createIdeaTextComponent = (
  content: string,
  options: Partial<Omit<ITextComponent, 'type' | 'content' | 'entityType'>> = {}
): ITextComponent => createTextComponent(content, 'idea', options);
```

## VisualComponent

### インターフェース

```typescript
interface IVisualComponent extends IComponent {
  readonly type: typeof ComponentTypes.VISUAL;
  
  // 基本表示制御
  visible: boolean;             // 表示するかどうか
  opacity: number;              // 透明度（0.0-1.0）
  
  // 形状設定
  shape: 'circle' | 'ellipse' | 'rect' | 'leaf' | 'custom'; // 形状タイプ
  width: number;                // 幅（px）
  height: number;               // 高さ（px）
  
  // 色設定
  fillColor: string;            // 塗りつぶし色（CSS色値）
  strokeColor: string;          // 枠線色（CSS色値）
  strokeWidth: number;          // 枠線幅（px）
  
  // グラデーション設定（オプション）
  gradient?: {
    type: 'linear' | 'radial';
    stops: Array<{ offset: number; color: string }>;
    direction?: string;         // linear用の方向
  };
  
  // 影設定（オプション）
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
  
  // CSS連携
  cssClasses: string[];         // 追加CSSクラス
  customStyles: Record<string, string>; // カスタムスタイル
  
  // SVG特有設定
  svgPath?: string;             // カスタム形状用のSVGパス
  svgAttributes?: Record<string, string>; // 追加SVG属性
}
```

### デフォルト値

```typescript
export const DEFAULT_VISUAL_COMPONENT: Omit<IVisualComponent, 'type'> = {
  visible: true,
  opacity: 1.0,
  shape: 'leaf',
  width: 40,
  height: 20,
  fillColor: '#10B981',
  strokeColor: '#059669',
  strokeWidth: 2,
  cssClasses: [],
  customStyles: {},
};

export const DEFAULT_THEME_VISUAL_COMPONENT: Omit<IVisualComponent, 'type'> = {
  ...DEFAULT_VISUAL_COMPONENT,
  shape: 'circle',
  width: 80,
  height: 80,
  fillColor: '#8B5CF6',
  strokeColor: '#7C3AED',
  strokeWidth: 3,
};

export const DEFAULT_IDEA_VISUAL_COMPONENT: Omit<IVisualComponent, 'type'> = {
  ...DEFAULT_VISUAL_COMPONENT,
  shape: 'leaf',
  width: 40,
  height: 20,
  fillColor: '#10B981',
  strokeColor: '#059669',
};
```

### ファクトリ関数

```typescript
export const createVisualComponent = (
  shape: IVisualComponent['shape'] = 'leaf',
  options: Partial<Omit<IVisualComponent, 'type' | 'shape'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_VISUAL_COMPONENT,
  shape,
  ...options,
});

export const createThemeVisualComponent = (
  options: Partial<Omit<IVisualComponent, 'type'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_THEME_VISUAL_COMPONENT,
  ...options,
});

export const createIdeaVisualComponent = (
  options: Partial<Omit<IVisualComponent, 'type'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_IDEA_VISUAL_COMPONENT,
  ...options,
});
```

## AnimationComponent

### インターフェース

```typescript
interface IAnimationComponent extends IComponent {
  readonly type: typeof ComponentTypes.ANIMATION;
  
  // アニメーション状態
  isAnimating: boolean;         // アニメーション実行中かどうか
  animationType: AnimationType; // アニメーションタイプ
  
  // タイミング制御
  duration: number;             // アニメーション時間（ミリ秒）
  delay: number;                // 開始遅延（ミリ秒）
  easing: EasingType;           // イージング関数
  
  // 進行状況
  progress: number;             // 進行状況（0.0-1.0）
  startTime?: number;           // 開始時刻（performance.now()）
  endTime?: number;             // 終了予定時刻
  
  // 繰り返し制御
  loop: boolean;                // ループするかどうか
  loopCount: number;            // ループ回数（-1で無限）
  currentLoop: number;          // 現在のループ回数
  
  // CSS連携
  cssTransition?: string;       // CSS transition プロパティ
  cssClasses: string[];         // アニメーション用CSSクラス
  
  // コールバック
  onStart?: () => void;         // 開始時コールバック
  onComplete?: () => void;      // 完了時コールバック
  onLoop?: () => void;          // ループ時コールバック
}
```

### デフォルト値

```typescript
export const DEFAULT_ANIMATION_COMPONENT: Omit<IAnimationComponent, 'type'> = {
  isAnimating: false,
  animationType: 'fadeIn',
  duration: 500,
  delay: 0,
  easing: 'ease-out',
  progress: 0,
  loop: false,
  loopCount: 1,
  currentLoop: 0,
  cssClasses: [],
};
```

### ファクトリ関数

```typescript
export const createAnimationComponent = (
  animationType: AnimationType = 'fadeIn',
  duration: number = 500,
  options: Partial<Omit<IAnimationComponent, 'type' | 'animationType' | 'duration'>> = {}
): IAnimationComponent => ({
  type: ComponentTypes.ANIMATION,
  ...DEFAULT_ANIMATION_COMPONENT,
  animationType,
  duration,
  ...options,
});

export const createPositionAnimationComponent = (
  duration: number = 500,
  easing: EasingType = 'ease-out'
): IAnimationComponent => createAnimationComponent('slideIn', duration, {
  easing,
  cssTransition: `transform ${duration}ms ${easing}`,
});
```

## 型ガード関数

```typescript
// コンポーネント型判定
export const isPositionComponent = (
  component: IComponent
): component is IPositionComponent =>
  component.type === ComponentTypes.POSITION;

export const isTextComponent = (
  component: IComponent
): component is ITextComponent => 
  component.type === ComponentTypes.TEXT;

export const isVisualComponent = (
  component: IComponent
): component is IVisualComponent =>
  component.type === ComponentTypes.VISUAL;

export const isAnimationComponent = (
  component: IComponent
): component is IAnimationComponent =>
  component.type === ComponentTypes.ANIMATION;
```

## ヘルパー関数

```typescript
// World経由でのコンポーネント取得
export const getPositionComponent = (
  world: IWorld,
  entityId: EntityId
): IPositionComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.POSITION);
  return component && isPositionComponent(component) ? component : undefined;
};

export const getTextComponent = (
  world: IWorld,
  entityId: EntityId
): ITextComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.TEXT);
  return component && isTextComponent(component) ? component : undefined;
};

export const getVisualComponent = (
  world: IWorld,
  entityId: EntityId
): IVisualComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.VISUAL);
  return component && isVisualComponent(component) ? component : undefined;
};

export const getAnimationComponent = (
  world: IWorld,
  entityId: EntityId
): IAnimationComponent | undefined => {
  const component = world.getComponent(entityId, ComponentTypes.ANIMATION);
  return component && isAnimationComponent(component) ? component : undefined;
};

// エンティティタイプ判定
export const isThemeEntity = (
  world: IWorld,
  entityId: EntityId
): boolean => {
  const textComponent = getTextComponent(world, entityId);
  return textComponent?.entityType === 'theme';
};

export const isIdeaEntity = (
  world: IWorld,
  entityId: EntityId
): boolean => {
  const textComponent = getTextComponent(world, entityId);
  return textComponent?.entityType === 'idea';
};

// フィロタキシス関連ヘルパー
export const getIdeaEntitiesSortedByIndex = (
  world: IWorld
): EntityId[] => {
  return world.getAllEntities()
    .filter(entityId => isIdeaEntity(world, entityId))
    .sort((a, b) => {
      const posA = getPositionComponent(world, a);
      const posB = getPositionComponent(world, b);
      return (posA?.index || 0) - (posB?.index || 0);
    });
};
```

## 使用例

```typescript
// エンティティ作成例
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

## 関連文書

> [!info] 関連API
> - [[ecs-systems|ECSシステムAPI]]
> - [[events|イベントAPI]]

> [!note] アーキテクチャ文書
> - [[../architecture/ecs/components|コンポーネント設計]]
> - [[../architecture/ecs/entities|エンティティ設計]]