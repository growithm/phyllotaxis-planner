/**
 * 視覚的表現を管理するコンポーネント
 * SVG描画やスタイリング情報を扱う
 */

import { ComponentTypes } from '@/ecs/core/Component';
import type { IComponent } from '@/ecs/core/Component';

/**
 * 視覚コンポーネントインターフェース
 */
export interface IVisualComponent extends IComponent {
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

/**
 * 視覚コンポーネントのデフォルト値
 */
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

/**
 * 中心テーマ用の視覚設定
 */
export const DEFAULT_THEME_VISUAL_COMPONENT: Omit<IVisualComponent, 'type'> = {
  ...DEFAULT_VISUAL_COMPONENT,
  shape: 'circle',
  width: 80,
  height: 80,
  fillColor: '#8B5CF6',
  strokeColor: '#7C3AED',
  strokeWidth: 3,
};

/**
 * アイデア用の視覚設定
 */
export const DEFAULT_IDEA_VISUAL_COMPONENT: Omit<IVisualComponent, 'type'> = {
  ...DEFAULT_VISUAL_COMPONENT,
  shape: 'leaf',
  width: 40,
  height: 20,
  fillColor: '#10B981',
  strokeColor: '#059669',
};

/**
 * 基本的な視覚コンポーネントを作成
 */
export const createVisualComponent = (
  shape: IVisualComponent['shape'] = 'leaf',
  options: Partial<Omit<IVisualComponent, 'type' | 'shape'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_VISUAL_COMPONENT,
  shape,
  ...options,
});

/**
 * テーマ用の視覚コンポーネントを作成
 */
export const createThemeVisualComponent = (
  options: Partial<Omit<IVisualComponent, 'type'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_THEME_VISUAL_COMPONENT,
  ...options,
});

/**
 * アイデア用の視覚コンポーネントを作成
 */
export const createIdeaVisualComponent = (
  options: Partial<Omit<IVisualComponent, 'type'>> = {}
): IVisualComponent => ({
  type: ComponentTypes.VISUAL,
  ...DEFAULT_IDEA_VISUAL_COMPONENT,
  ...options,
});

/**
 * 視覚コンポーネントの型ガード
 */
export const isVisualComponent = (
  component: IComponent
): component is IVisualComponent =>
  component.type === ComponentTypes.VISUAL;