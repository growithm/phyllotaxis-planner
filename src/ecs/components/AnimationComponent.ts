/**
 * アニメーション状態を管理するコンポーネント
 * CSS transitionやアニメーション進行状況を扱う
 */

import { ComponentTypes } from '@/ecs/core/Component';
import type { IComponent } from '@/ecs/core/Component';
import type { AnimationType, EasingType } from '@/types';

/**
 * アニメーションコンポーネントインターフェース
 */
export interface IAnimationComponent extends IComponent {
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

/**
 * アニメーションコンポーネントのデフォルト値
 */
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

/**
 * 基本的なアニメーションコンポーネントを作成
 */
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

/**
 * 位置アニメーション用のコンポーネントを作成
 */
export const createPositionAnimationComponent = (
  duration: number = 500,
  easing: EasingType = 'ease-out'
): IAnimationComponent => createAnimationComponent('slideIn', duration, {
  easing,
  cssTransition: `transform ${duration}ms ${easing}`,
});

/**
 * アニメーションコンポーネントの型ガード
 */
export const isAnimationComponent = (
  component: IComponent
): component is IAnimationComponent =>
  component.type === ComponentTypes.ANIMATION;