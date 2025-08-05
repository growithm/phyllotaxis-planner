/**
 * 位置情報を管理するコンポーネント
 * フィロタキシス配置やアニメーション位置を扱う
 */

import { ComponentTypes } from '@/ecs/core/Component';
import type { IComponent } from '@/ecs/core/Component';

/**
 * 位置コンポーネントインターフェース
 */
export interface IPositionComponent extends IComponent {
  readonly type: typeof ComponentTypes.POSITION;

  // 基本位置情報
  x: number; // X座標（SVG座標系）
  y: number; // Y座標（SVG座標系）

  // フィロタキシス情報
  angle: number; // 角度（度）- フィロタキシス計算で使用
  radius: number; // 中心からの距離
  index: number; // フィロタキシス配置インデックス（0から始まる）

  // 表示制御
  scale: number; // スケール（1.0が基準）
  zIndex: number; // 描画順序（大きいほど前面）

  // アニメーション用
  targetX?: number; // アニメーション目標X座標
  targetY?: number; // アニメーション目標Y座標
  isAnimating: boolean; // アニメーション中かどうか
}

/**
 * 位置コンポーネントのデフォルト値
 */
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

/**
 * 基本的な位置コンポーネントを作成
 */
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

/**
 * フィロタキシス用の位置コンポーネントを作成
 */
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

/**
 * 位置コンポーネントの型ガード
 */
export const isPositionComponent = (
  component: IComponent
): component is IPositionComponent =>
  component.type === ComponentTypes.POSITION;
