---
title: "コンポーネントAPI仕様"
type: api
category: components
tags: [api, components, react, props, state, typescript]
related:
  - "[[ecs-systems]]"
  - "[[events]]"
  - "[[../architecture/component-diagram]]"
created: 2025-02-08
---

# コンポーネントAPI仕様

> [!info] 概要
> Phyllotaxis PlannerのReactコンポーネントのProps、State、メソッドの詳細仕様を定義します。

## 基本型定義

### 共通型

```typescript
// types/index.ts
export interface Position {
  x: number;
  y: number;
}

export interface Idea {
  id: string;
  text: string;
  position: Position;
  angle: number;
  radius: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhyllotaxisConfig {
  goldenAngle: number;        // 137.5077640500378度
  radiusScale: number;        // 半径スケール係数
  centerX: number;           // SVG中心X座標
  centerY: number;           // SVG中心Y座標
  minRadius: number;         // 最小半径
  maxIdeas: number;          // 最大アイデア数
}

export interface AnimationState {
  isAnimating: boolean;
  duration: number;
  easing: string;
  progress: number;
}

export type ThemeColor = 'green' | 'blue' | 'purple' | 'orange';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
```

## メインコンポーネント

### PhyllotaxisMap

> [!note] 責務
> アプリケーション全体の状態管理と描画領域の提供

#### Props

```typescript
interface PhyllotaxisMapProps {
  // 初期設定
  initialTheme?: string;
  initialConfig?: Partial<PhyllotaxisConfig>;
  
  // スタイリング
  className?: string;
  style?: React.CSSProperties;
  themeColor?: ThemeColor;
  
  // イベントハンドラー
  onIdeaAdded?: (idea: Idea) => void;
  onIdeaRemoved?: (ideaId: string) => void;
  onThemeChanged?: (theme: string) => void;
  onConfigChanged?: (config: PhyllotaxisConfig) => void;
  
  // 機能制御
  readonly?: boolean;
  maxIdeas?: number;
  enableAnimation?: boolean;
  enableTooltips?: boolean;
  
  // アクセシビリティ
  ariaLabel?: string;
  ariaDescription?: string;
}
```

#### State

```typescript
interface PhyllotaxisMapState {
  // コア状態
  centerTheme: string;
  ideas: Idea[];
  config: PhyllotaxisConfig;
  
  // UI状態
  isLoading: boolean;
  selectedIdeaId: string | null;
  hoveredIdeaId: string | null;
  
  // アニメーション状態
  animatingIds: Set<string>;
  
  // エラー状態
  error: string | null;
  
  // デバイス情報
  deviceType: DeviceType;
  viewportSize: { width: number; height: number };
}
```

#### メソッド

```typescript
interface PhyllotaxisMapRef {
  // アイデア操作
  addIdea: (text: string) => Promise<string>;
  removeIdea: (ideaId: string) => Promise<void>;
  updateIdea: (ideaId: string, text: string) => Promise<void>;
  
  // テーマ操作
  setTheme: (theme: string) => void;
  getTheme: () => string;
  
  // 設定操作
  updateConfig: (config: Partial<PhyllotaxisConfig>) => void;
  resetConfig: () => void;
  
  // 表示制御
  focusIdea: (ideaId: string) => void;
  centerView: () => void;
  zoomToFit: () => void;
  
  // データ操作
  exportData: () => ExportData;
  importData: (data: ExportData) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // アニメーション制御
  pauseAnimations: () => void;
  resumeAnimations: () => void;
}

interface ExportData {
  version: string;
  theme: string;
  ideas: Idea[];
  config: PhyllotaxisConfig;
  exportedAt: Date;
}
```

#### 使用例

```typescript
const MyApp: React.FC = () => {
  const mapRef = useRef<PhyllotaxisMapRef>(null);
  
  const handleIdeaAdded = (idea: Idea) => {
    console.log('New idea added:', idea.text);
  };
  
  const handleExport = () => {
    const data = mapRef.current?.exportData();
    if (data) {
      downloadJSON(data, 'phyllotaxis-map.json');
    }
  };
  
  return (
    <PhyllotaxisMap
      ref={mapRef}
      initialTheme="My Project"
      themeColor="green"
      maxIdeas={50}
      onIdeaAdded={handleIdeaAdded}
      enableAnimation={true}
      ariaLabel="Phyllotaxis idea map"
    />
  );
};
```

### CenterTheme

> [!note] 責務
> 中心テーマの表示と編集機能

#### Props

```typescript
interface CenterThemeProps {
  // データ
  theme: string;
  position: Position;
  
  // 表示設定
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  
  // 編集設定
  editable?: boolean;
  maxLength?: number;
  placeholder?: string;
  
  // イベントハンドラー
  onThemeChange: (theme: string) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onValidationError?: (error: string) => void;
  
  // 状態
  isEditing?: boolean;
  isAnimating?: boolean;
  
  // スタイリング
  className?: string;
  style?: React.CSSProperties;
  
  // アクセシビリティ
  ariaLabel?: string;
  tabIndex?: number;
}
```

#### 使用例

```typescript
const CenterThemeExample: React.FC = () => {
  const [theme, setTheme] = useState('My Project');
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <CenterTheme
      theme={theme}
      position={{ x: 400, y: 300 }}
      editable={true}
      maxLength={50}
      placeholder="Enter your main theme..."
      onThemeChange={setTheme}
      onEditStart={() => setIsEditing(true)}
      onEditEnd={() => setIsEditing(false)}
      isEditing={isEditing}
      ariaLabel="Main theme editor"
    />
  );
};
```

### IdeaNode

> [!note] 責務
> 個別アイデアの視覚的表現

#### Props

```typescript
interface IdeaNodeProps {
  // データ
  idea: Idea;
  
  // 表示設定
  shape?: 'leaf' | 'circle' | 'square' | 'custom';
  size?: 'small' | 'medium' | 'large' | number;
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  
  // テキスト設定
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  
  // 状態
  isSelected?: boolean;
  isHovered?: boolean;
  isAnimating?: boolean;
  animationState?: AnimationState;
  
  // インタラクション
  clickable?: boolean;
  hoverable?: boolean;
  draggable?: boolean;
  
  // イベントハンドラー
  onClick?: (idea: Idea, event: React.MouseEvent) => void;
  onDoubleClick?: (idea: Idea, event: React.MouseEvent) => void;
  onMouseEnter?: (idea: Idea, event: React.MouseEvent) => void;
  onMouseLeave?: (idea: Idea, event: React.MouseEvent) => void;
  onDragStart?: (idea: Idea, event: React.DragEvent) => void;
  onDragEnd?: (idea: Idea, event: React.DragEvent) => void;
  
  // スタイリング
  className?: string;
  style?: React.CSSProperties;
  
  // アクセシビリティ
  ariaLabel?: string;
  role?: string;
  tabIndex?: number;
}
```

#### 使用例

```typescript
const IdeaNodeExample: React.FC = () => {
  const idea: Idea = {
    id: 'idea-1',
    text: 'Great idea!',
    position: { x: 150, y: 200 },
    angle: 45,
    radius: 100,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const handleClick = (idea: Idea) => {
    console.log('Clicked idea:', idea.text);
  };
  
  return (
    <IdeaNode
      idea={idea}
      shape="leaf"
      size="medium"
      color="#10B981"
      clickable={true}
      hoverable={true}
      onClick={handleClick}
      ariaLabel={`Idea: ${idea.text}`}
    />
  );
};
```

### AddIdeaForm

> [!note] 責務
> 新しいアイデアの入力と追加

#### Props

```typescript
interface AddIdeaFormProps {
  // 機能設定
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  
  // 表示設定
  variant?: 'inline' | 'modal' | 'sidebar';
  size?: 'small' | 'medium' | 'large';
  
  // 状態
  isDisabled?: boolean;
  isLoading?: boolean;
  
  // バリデーション
  validator?: (text: string) => string | null;
  showCharacterCount?: boolean;
  
  // イベントハンドラー
  onAddIdea: (text: string) => void | Promise<void>;
  onCancel?: () => void;
  onValidationError?: (error: string) => void;
  onTextChange?: (text: string) => void;
  
  // スタイリング
  className?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  buttonClassName?: string;
  
  // アクセシビリティ
  ariaLabel?: string;
  ariaDescription?: string;
  autoFocus?: boolean;
}
```

#### State

```typescript
interface AddIdeaFormState {
  text: string;
  isSubmitting: boolean;
  validationError: string | null;
  characterCount: number;
}
```

#### 使用例

```typescript
const AddIdeaFormExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAddIdea = async (text: string) => {
    setIsLoading(true);
    try {
      await addIdeaToDatabase(text);
      console.log('Idea added:', text);
    } catch (error) {
      console.error('Failed to add idea:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateIdea = (text: string): string | null => {
    if (text.trim().length < 3) {
      return 'Idea must be at least 3 characters long';
    }
    if (text.length > 100) {
      return 'Idea must be less than 100 characters';
    }
    return null;
  };
  
  return (
    <AddIdeaForm
      maxLength={100}
      minLength={3}
      placeholder="Enter your new idea..."
      variant="inline"
      isLoading={isLoading}
      validator={validateIdea}
      showCharacterCount={true}
      onAddIdea={handleAddIdea}
      ariaLabel="Add new idea form"
      autoFocus={true}
    />
  );
};
```

## カスタムフック

### usePhyllotaxis

> [!note] 責務
> フィロタキシス計算とアイデア管理のロジック

#### インターフェース

```typescript
interface UsePhyllotaxisOptions {
  initialTheme?: string;
  initialConfig?: Partial<PhyllotaxisConfig>;
  maxIdeas?: number;
  enablePersistence?: boolean;
  storageKey?: string;
}

interface UsePhyllotaxisReturn {
  // 状態
  theme: string;
  ideas: Idea[];
  config: PhyllotaxisConfig;
  isLoading: boolean;
  error: string | null;
  
  // アクション
  setTheme: (theme: string) => void;
  addIdea: (text: string) => Promise<string>;
  removeIdea: (ideaId: string) => Promise<void>;
  updateIdea: (ideaId: string, text: string) => Promise<void>;
  updateConfig: (config: Partial<PhyllotaxisConfig>) => void;
  
  // ユーティリティ
  calculatePosition: (index: number) => Position;
  getIdeaById: (ideaId: string) => Idea | undefined;
  clearAll: () => Promise<void>;
  exportData: () => ExportData;
  importData: (data: ExportData) => Promise<void>;
}

// 使用例
const usePhyllotaxis: (options?: UsePhyllotaxisOptions) => UsePhyllotaxisReturn;
```

### useEventBus

> [!note] 責務
> イベントバス管理とイベントハンドリング

#### インターフェース

```typescript
interface UseEventBusReturn {
  // イベント発行
  emit: <K extends keyof EventMap>(event: K, data: EventMap[K]) => void;
  
  // イベント購読
  subscribe: <K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ) => () => void;
  
  // 一回限りの購読
  subscribeOnce: <K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ) => void;
  
  // EventBusインスタンス
  eventBus: EventBus;
}

// 使用例
const useEventBus: () => UseEventBusReturn;
```

### useAnimation

> [!note] 責務
> アニメーション状態管理

#### インターフェース

```typescript
interface UseAnimationOptions {
  duration?: number;
  easing?: string;
  autoStart?: boolean;
  loop?: boolean;
  delay?: number;
}

interface UseAnimationReturn {
  // 状態
  isAnimating: boolean;
  progress: number;
  
  // 制御
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  
  // 設定
  setDuration: (duration: number) => void;
  setEasing: (easing: string) => void;
}

// 使用例
const useAnimation: (options?: UseAnimationOptions) => UseAnimationReturn;
```

## エラーハンドリング

### エラー型定義

```typescript
export class PhyllotaxisError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'PhyllotaxisError';
  }
}

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  ANIMATION_ERROR = 'ANIMATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### エラーハンドラー

```typescript
interface ErrorHandler {
  (error: PhyllotaxisError): void;
}

interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: ErrorHandler;
  children: React.ReactNode;
}
```

## バリデーション

### バリデーター型

```typescript
type Validator<T> = (value: T) => string | null;

// 共通バリデーター
export const validators = {
  required: (message = 'This field is required'): Validator<string> =>
    (value) => value.trim() ? null : message,
    
  minLength: (min: number, message?: string): Validator<string> =>
    (value) => value.length >= min ? null : message || `Minimum ${min} characters required`,
    
  maxLength: (max: number, message?: string): Validator<string> =>
    (value) => value.length <= max ? null : message || `Maximum ${max} characters allowed`,
    
  pattern: (regex: RegExp, message = 'Invalid format'): Validator<string> =>
    (value) => regex.test(value) ? null : message,
};
```

## テスト支援

### テストユーティリティ

```typescript
// テスト用のモックデータ
export const mockIdea: Idea = {
  id: 'test-idea-1',
  text: 'Test Idea',
  position: { x: 100, y: 150 },
  angle: 45,
  radius: 80,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

export const mockConfig: PhyllotaxisConfig = {
  goldenAngle: 137.5077640500378,
  radiusScale: 10,
  centerX: 400,
  centerY: 300,
  minRadius: 50,
  maxIdeas: 50
};

// テスト用のレンダーヘルパー
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: {
    initialState?: Partial<PhyllotaxisMapState>;
    eventBus?: EventBus;
  }
) => {
  // テスト用のプロバイダーでラップしてレンダー
};
```

## 関連文書

> [!info] API仕様書
> - [[ecs-systems|ECSシステムAPI]]
> - [[events|イベントAPI]]

> [!note] アーキテクチャ文書
> - [[../architecture/component-diagram|コンポーネント関係図]]
> - [[../architecture/ecs/components|ECSコンポーネント設計]]
> - [[../architecture/event-driven-design|イベント駆動設計]]

> [!tip] 実装ガイド
> - [[../guides/development|開発環境セットアップ]]
> - [[../guides/contributing|コントリビューションガイド]]